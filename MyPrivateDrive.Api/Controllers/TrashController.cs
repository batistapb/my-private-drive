using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyPrivateDrive.Application.Files;
using MyPrivateDrive.Application.Trash;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trash")]
[EnableRateLimiting("global")]
public class TrashController(AppDbContext db, IOptions<StorageSettings> storageOptions, IWebHostEnvironment env) : ControllerBase
{
    private readonly StorageSettings _settings = storageOptions.Value;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string StorageRoot => Path.Combine(env.ContentRootPath, _settings.Root);

    // Only the item the user actually deleted is listed — not every descendant swept up by the
    // folder cascade — same as Google Drive: a folder's trashed children don't get their own row.
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var trashedFolders = await db.Folders.IgnoreQueryFilters()
            .Where(f => f.OwnerId == CurrentUserId && f.DeletedAt != null && (
                f.ParentFolderId == null ||
                !db.Folders.IgnoreQueryFilters().Any(p => p.Id == f.ParentFolderId && p.DeletedAt != null)))
            .Select(f => new TrashItemDto(f.Id, f.Name, "folder", f.DeletedAt!.Value))
            .ToListAsync();

        var trashedFiles = await db.Files.IgnoreQueryFilters()
            .Where(f => f.OwnerId == CurrentUserId && f.DeletedAt != null && (
                f.FolderId == null ||
                !db.Folders.IgnoreQueryFilters().Any(p => p.Id == f.FolderId && p.DeletedAt != null)))
            .Select(f => new TrashItemDto(f.Id, f.OriginalName, "file", f.DeletedAt!.Value))
            .ToListAsync();

        var items = trashedFolders.Concat(trashedFiles).OrderByDescending(i => i.DeletedAt).ToList();
        return Ok(items);
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id)
    {
        var folder = await db.Folders.IgnoreQueryFilters()
            .SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId && f.DeletedAt != null);
        if (folder is not null)
        {
            await RestoreRecursiveAsync(folder.Id);
            await db.SaveChangesAsync();
            return NoContent();
        }

        var file = await db.Files.IgnoreQueryFilters()
            .SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId && f.DeletedAt != null);
        if (file is not null)
        {
            file.DeletedAt = null;
            await db.SaveChangesAsync();
            return NoContent();
        }

        return NotFound();
    }

    private async Task RestoreRecursiveAsync(Guid folderId)
    {
        var folder = await db.Folders.IgnoreQueryFilters().SingleAsync(f => f.Id == folderId);
        folder.DeletedAt = null;

        var subfolderIds = await db.Folders.IgnoreQueryFilters()
            .Where(f => f.ParentFolderId == folderId && f.DeletedAt != null)
            .Select(f => f.Id)
            .ToListAsync();

        foreach (var subfolderId in subfolderIds)
            await RestoreRecursiveAsync(subfolderId);

        var files = await db.Files.IgnoreQueryFilters()
            .Where(f => f.FolderId == folderId && f.DeletedAt != null)
            .ToListAsync();

        foreach (var file in files)
            file.DeletedAt = null;
    }

    [HttpDelete("{id:guid}/permanent")]
    public async Task<IActionResult> DeletePermanently(Guid id)
    {
        var folder = await db.Folders.IgnoreQueryFilters()
            .SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId && f.DeletedAt != null);
        if (folder is not null)
        {
            await PurgeRecursiveAsync(folder.Id);
            await db.SaveChangesAsync();
            return NoContent();
        }

        var file = await db.Files.IgnoreQueryFilters()
            .SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId && f.DeletedAt != null);
        if (file is not null)
        {
            DeletePhysicalFile(file.StoredName);
            db.Files.Remove(file);
            await db.SaveChangesAsync();
            return NoContent();
        }

        return NotFound();
    }

    private async Task PurgeRecursiveAsync(Guid folderId)
    {
        var subfolderIds = await db.Folders.IgnoreQueryFilters()
            .Where(f => f.ParentFolderId == folderId)
            .Select(f => f.Id)
            .ToListAsync();

        foreach (var subfolderId in subfolderIds)
            await PurgeRecursiveAsync(subfolderId);

        var files = await db.Files.IgnoreQueryFilters().Where(f => f.FolderId == folderId).ToListAsync();
        foreach (var file in files)
        {
            DeletePhysicalFile(file.StoredName);
            db.Files.Remove(file);
        }

        var folder = await db.Folders.IgnoreQueryFilters().SingleAsync(f => f.Id == folderId);
        db.Folders.Remove(folder);
    }

    private void DeletePhysicalFile(string storedName)
    {
        var path = Path.Combine(StorageRoot, storedName);
        if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
    }
}
