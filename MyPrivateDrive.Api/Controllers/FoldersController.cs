using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Application.Files;
using MyPrivateDrive.Application.Folders;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/folders")]
[EnableRateLimiting("global")]
public class FoldersController(AppDbContext db, IContentTypeProvider contentTypeProvider) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string GetContentType(string fileName) =>
        contentTypeProvider.TryGetContentType(fileName, out var contentType) ? contentType : "application/octet-stream";

    [HttpGet]
    public Task<IActionResult> GetRoot() => GetContents(null);

    [HttpGet("{id:guid}")]
    public Task<IActionResult> GetFolder(Guid id) => GetContents(id);

    private async Task<IActionResult> GetContents(Guid? id)
    {
        FolderDto? folderDto = null;
        var ancestors = new List<FolderDto>();

        if (id is not null)
        {
            var folder = await db.Folders.SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId);
            if (folder is null) return NotFound();
            folderDto = ToDto(folder);
            ancestors = await GetAncestorsAsync(folder.ParentFolderId);
        }

        // At the true root (id == null), organization root folders (which also have ParentFolderId == null)
        // must be excluded — they surface via the organizations list/tabs, not "Meus Arquivos".
        var subfolders = await db.Folders
            .Where(f => f.OwnerId == CurrentUserId && f.ParentFolderId == id && (id != null || f.OrganizationId == null))
            .Select(f => new FolderDto(f.Id, f.Name, f.ParentFolderId, f.OrganizationId, f.CreatedAt))
            .ToListAsync();

        var files = (await db.Files
            .Where(f => f.OwnerId == CurrentUserId && f.FolderId == id)
            .ToListAsync())
            .Select(f => new FileItemDto(f.Id, f.OriginalName, f.SizeBytes, f.FolderId, f.CreatedAt, GetContentType(f.OriginalName)))
            .ToList();

        return Ok(new FolderContentsDto(folderDto, ancestors, subfolders, files));
    }

    private async Task<List<FolderDto>> GetAncestorsAsync(Guid? parentId)
    {
        var chain = new List<FolderDto>();
        var currentId = parentId;

        while (currentId is not null)
        {
            var folder = await db.Folders.SingleOrDefaultAsync(f => f.Id == currentId && f.OwnerId == CurrentUserId);
            if (folder is null) break;

            chain.Add(ToDto(folder));
            currentId = folder.ParentFolderId;
        }

        chain.Reverse();
        return chain;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateFolderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Nome da pasta é obrigatório.");

        Guid? organizationId = null;
        if (request.ParentFolderId is not null)
        {
            var parent = await db.Folders.SingleOrDefaultAsync(f => f.Id == request.ParentFolderId && f.OwnerId == CurrentUserId);
            if (parent is null) return BadRequest("Pasta pai inválida.");
            organizationId = parent.OrganizationId;
        }

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentFolderId = request.ParentFolderId,
            OwnerId = CurrentUserId,
            OrganizationId = organizationId
        };

        db.Folders.Add(folder);
        await db.SaveChangesAsync();

        return Ok(ToDto(folder));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateFolderRequest request)
    {
        var folder = await db.Folders.SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId);
        if (folder is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name))
            folder.Name = request.Name;

        // ParentFolderId == null is ambiguous between "not provided" and "move to root",
        // so moving to root requires the explicit MoveToRoot flag instead.
        var wantsMove = request.ParentFolderId is not null || request.MoveToRoot;

        if (wantsMove)
        {
            var newParentId = request.MoveToRoot ? null : request.ParentFolderId;

            if (newParentId != folder.ParentFolderId)
            {
                if (newParentId == folder.Id)
                    return BadRequest("Uma pasta não pode ser pai de si mesma.");

                if (newParentId is not null)
                {
                    var newParent = await db.Folders.SingleOrDefaultAsync(f => f.Id == newParentId && f.OwnerId == CurrentUserId);
                    if (newParent is null) return BadRequest("Pasta pai inválida.");

                    if (await IsDescendantAsync(folder.Id, newParent.Id))
                        return BadRequest("Não é possível mover uma pasta para dentro de si mesma.");
                }

                folder.ParentFolderId = newParentId;
            }
        }

        await db.SaveChangesAsync();

        return Ok(ToDto(folder));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var folder = await db.Folders.SingleOrDefaultAsync(f => f.Id == id && f.OwnerId == CurrentUserId);
        if (folder is null) return NotFound();

        await SoftDeleteRecursiveAsync(folder.Id, DateTime.UtcNow);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // Moving a folder to trash cascades to its whole subtree, mirroring Google Drive-style trash semantics.
    private async Task SoftDeleteRecursiveAsync(Guid folderId, DateTime deletedAt)
    {
        var folder = await db.Folders.SingleAsync(f => f.Id == folderId);
        folder.DeletedAt = deletedAt;

        var subfolderIds = await db.Folders
            .Where(f => f.ParentFolderId == folderId)
            .Select(f => f.Id)
            .ToListAsync();

        foreach (var subfolderId in subfolderIds)
            await SoftDeleteRecursiveAsync(subfolderId, deletedAt);

        var files = await db.Files.Where(f => f.FolderId == folderId).ToListAsync();
        foreach (var file in files)
            file.DeletedAt = deletedAt;
    }

    private async Task<bool> IsDescendantAsync(Guid ancestorId, Guid candidateId)
    {
        var currentId = (Guid?)candidateId;
        while (currentId is not null)
        {
            if (currentId == ancestorId) return true;
            currentId = await db.Folders
                .Where(f => f.Id == currentId)
                .Select(f => f.ParentFolderId)
                .SingleOrDefaultAsync();
        }
        return false;
    }

    private static FolderDto ToDto(Folder f) => new(f.Id, f.Name, f.ParentFolderId, f.OrganizationId, f.CreatedAt);
}
