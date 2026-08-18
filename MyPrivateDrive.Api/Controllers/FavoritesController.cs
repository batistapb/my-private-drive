using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Application.Favorites;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/favorites")]
[EnableRateLimiting("global")]
public class FavoritesController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var folders = await db.Folders
            .Where(f => f.OwnerId == CurrentUserId && f.IsFavorite)
            .Select(f => new FavoriteItemDto(f.Id, f.Name, "folder", f.ParentFolderId))
            .ToListAsync();

        var files = await db.Files
            .Where(f => f.OwnerId == CurrentUserId && f.IsFavorite)
            .Select(f => new FavoriteItemDto(f.Id, f.OriginalName, "file", f.FolderId))
            .ToListAsync();

        return Ok(folders.Concat(files));
    }
}
