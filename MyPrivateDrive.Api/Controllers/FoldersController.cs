using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        var subfolders = await db.Folders
            .Where(f => f.OwnerId == CurrentUserId && f.ParentFolderId == id)
            .Select(f => new FolderDto(f.Id, f.Name, f.ParentFolderId, f.CreatedAt))
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

        if (request.ParentFolderId is not null &&
            !await db.Folders.AnyAsync(f => f.Id == request.ParentFolderId && f.OwnerId == CurrentUserId))
            return BadRequest("Pasta pai inválida.");

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentFolderId = request.ParentFolderId,
            OwnerId = CurrentUserId
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

        var hasSubfolders = await db.Folders.AnyAsync(f => f.ParentFolderId == id);
        var hasFiles = await db.Files.AnyAsync(f => f.FolderId == id);
        if (hasSubfolders || hasFiles)
            return Conflict("A pasta não está vazia.");

        db.Folders.Remove(folder);
        await db.SaveChangesAsync();

        return NoContent();
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

    private static FolderDto ToDto(Folder f) => new(f.Id, f.Name, f.ParentFolderId, f.CreatedAt);
}
