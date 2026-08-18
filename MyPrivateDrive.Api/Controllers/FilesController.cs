using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyPrivateDrive.Application.Files;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/files")]
[EnableRateLimiting("global")]
public class FilesController(AppDbContext db, IOptions<StorageSettings> storageOptions, IWebHostEnvironment env, IContentTypeProvider contentTypeProvider) : ControllerBase
{
    private static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".sh", ".bat", ".cmd", ".msi", ".com", ".ps1"
    };

    private static readonly HashSet<string> PreviewableContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/gif", "image/webp",
        "application/pdf",
        "text/plain"
    };

    private readonly StorageSettings _settings = storageOptions.Value;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string StorageRoot => Path.Combine(env.ContentRootPath, _settings.Root);

    private string GetContentType(string fileName) =>
        contentTypeProvider.TryGetContentType(fileName, out var contentType) ? contentType : "application/octet-stream";

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] Guid? folderId)
    {
        if (file.Length == 0 || file.Length > _settings.MaxSizeBytes)
            return BadRequest("Arquivo inválido.");

        var extension = Path.GetExtension(file.FileName);
        if (BlockedExtensions.Contains(extension))
            return BadRequest("Tipo de arquivo não permitido.");

        if (folderId is not null &&
            !await db.Folders.AnyAsync(f => f.Id == folderId && f.OwnerId == CurrentUserId))
            return BadRequest("Pasta inválida.");

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

        return Ok(new FileItemDto(fileItem.Id, fileItem.OriginalName, fileItem.SizeBytes, fileItem.FolderId, fileItem.CreatedAt, GetContentType(fileItem.OriginalName)));
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

    [HttpGet("{id:guid}/preview")]
    public async Task<IActionResult> Preview(Guid id)
    {
        var fileItem = await db.Files.FindAsync(id);
        if (fileItem is null || fileItem.OwnerId != CurrentUserId)
            return NotFound();

        var contentType = GetContentType(fileItem.OriginalName);
        if (!PreviewableContentTypes.Contains(contentType))
            return StatusCode(StatusCodes.Status415UnsupportedMediaType, "Tipo de arquivo sem suporte a preview.");

        var path = Path.Combine(StorageRoot, fileItem.StoredName);
        if (!System.IO.File.Exists(path))
            return NotFound();

        Response.Headers.ContentDisposition = "inline";
        var stream = new FileStream(path, FileMode.Open, FileAccess.Read);
        return File(stream, contentType);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var fileItem = await db.Files.SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId);
        if (fileItem is null) return NotFound();

        fileItem.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
    }
}
