using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Application.Search;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/search")]
[EnableRateLimiting("global")]
public class SearchController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<SearchResultDto>());

        var folders = await db.Folders
            .Where(f => f.OwnerId == CurrentUserId && EF.Functions.ILike(f.Name, $"%{q}%"))
            .ToListAsync();

        var files = await db.Files
            .Where(f => f.OwnerId == CurrentUserId && EF.Functions.ILike(f.OriginalName, $"%{q}%"))
            .ToListAsync();

        var results = new List<SearchResultDto>();

        foreach (var folder in folders)
        {
            var path = await GetPathNamesAsync(folder.ParentFolderId);
            results.Add(new SearchResultDto(folder.Id, folder.Name, "folder", folder.ParentFolderId, path));
        }

        foreach (var file in files)
        {
            var path = await GetPathNamesAsync(file.FolderId);
            results.Add(new SearchResultDto(file.Id, file.OriginalName, "file", file.FolderId, path));
        }

        return Ok(results);
    }

    // Root-to-parent ordered list of folder names, for rendering "onde o item está" per result.
    private async Task<List<string>> GetPathNamesAsync(Guid? parentId)
    {
        var names = new List<string>();
        var currentId = parentId;

        while (currentId is not null)
        {
            var folder = await db.Folders.SingleOrDefaultAsync(f => f.Id == currentId && f.OwnerId == CurrentUserId);
            if (folder is null) break;

            names.Add(folder.Name);
            currentId = folder.ParentFolderId;
        }

        names.Reverse();
        return names;
    }
}
