using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MyPrivateDrive.Application.Files;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/files")]
public class FilesController(AppDbContext db, IOptions<StorageSettings> storageOptions, IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".sh", ".bat", ".cmd", ".msi", ".com", ".ps1"
    };

    private readonly StorageSettings _settings = storageOptions.Value;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string StorageRoot => Path.Combine(env.ContentRootPath, _settings.Root);

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] Guid? folderId)
    {
        if (file.Length == 0 || file.Length > _settings.MaxSizeBytes)
            return BadRequest("Arquivo inválido.");

        var extension = Path.GetExtension(file.FileName);
        if (BlockedExtensions.Contains(extension))
            return BadRequest("Tipo de arquivo não permitido.");

        var storedName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(StorageRoot, storedName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileItem = new FileItem
        {
            Id = Guid.NewGuid(),
            OriginalName = file.FileName,
            StoredName = storedName,
            SizeBytes = file.Length,
            OwnerId = CurrentUserId,
            FolderId = folderId
        };

        db.Files.Add(fileItem);
        await db.SaveChangesAsync();

        return Ok(new FileItemDto(fileItem.Id, fileItem.OriginalName, fileItem.SizeBytes, fileItem.FolderId, fileItem.CreatedAt));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var fileItem = await db.Files.FindAsync(id);
        if (fileItem is null || fileItem.OwnerId != CurrentUserId)
            return NotFound();

        var path = Path.Combine(StorageRoot, fileItem.StoredName);
        if (!System.IO.File.Exists(path))
            return NotFound();

        var stream = new FileStream(path, FileMode.Open, FileAccess.Read);
        return File(stream, "application/octet-stream", fileItem.OriginalName);
    }
}
