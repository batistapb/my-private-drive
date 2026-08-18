using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyPrivateDrive.Application.Files;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.BackgroundServices;

public class TrashCleanupService(IServiceScopeFactory scopeFactory, ILogger<TrashCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan RetentionPeriod = TimeSpan.FromDays(30);
    private static readonly TimeSpan RunInterval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PurgeExpiredAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Falha ao limpar itens expirados da lixeira.");
            }

            try
            {
                await Task.Delay(RunInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task PurgeExpiredAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storageSettings = scope.ServiceProvider.GetRequiredService<IOptions<StorageSettings>>().Value;
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var storageRoot = Path.Combine(env.ContentRootPath, storageSettings.Root);

        var cutoff = DateTime.UtcNow - RetentionPeriod;

        var expiredFiles = await db.Files.IgnoreQueryFilters()
            .Where(f => f.DeletedAt != null && f.DeletedAt < cutoff)
            .ToListAsync(ct);

        foreach (var file in expiredFiles)
        {
            var path = Path.Combine(storageRoot, file.StoredName);
            if (File.Exists(path)) File.Delete(path);
            db.Files.Remove(file);
        }

        var expiredFolders = await db.Folders.IgnoreQueryFilters()
            .Where(f => f.DeletedAt != null && f.DeletedAt < cutoff)
            .ToListAsync(ct);
        db.Folders.RemoveRange(expiredFolders);

        if (expiredFiles.Count > 0 || expiredFolders.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Lixeira: {Files} arquivo(s) e {Folders} pasta(s) removidos permanentemente (mais de {Days} dias na lixeira).",
                expiredFiles.Count, expiredFolders.Count, RetentionPeriod.TotalDays);
        }
    }
}
