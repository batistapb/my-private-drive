using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Application.Organizations;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/organizations")]
[EnableRateLimiting("global")]
public class OrganizationsController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var organizations = await db.Organizations
            .Where(o => o.OwnerId == CurrentUserId)
            .Select(o => new OrganizationDto(o.Id, o.Name, o.RootFolderId, o.CreatedAt))
            .ToListAsync();

        return Ok(organizations);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var organization = await db.Organizations.SingleOrDefaultAsync(o => o.Id == id && o.OwnerId == CurrentUserId);
        if (organization is null) return NotFound();

        return Ok(ToDto(organization));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrganizationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Nome da organização é obrigatório.");

        var organizationId = Guid.NewGuid();

        var rootFolder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentFolderId = null,
            OwnerId = CurrentUserId,
            OrganizationId = organizationId
        };

        var organization = new Organization
        {
            Id = organizationId,
            Name = request.Name,
            OwnerId = CurrentUserId,
            RootFolderId = rootFolder.Id
        };

        db.Folders.Add(rootFolder);
        db.Organizations.Add(organization);
        await db.SaveChangesAsync();

        return Ok(ToDto(organization));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var organization = await db.Organizations.SingleOrDefaultAsync(o => o.Id == id && o.OwnerId == CurrentUserId);
        if (organization is null) return NotFound();

        var hasSubfolders = await db.Folders.AnyAsync(f => f.ParentFolderId == organization.RootFolderId);
        var hasFiles = await db.Files.AnyAsync(f => f.FolderId == organization.RootFolderId);
        if (hasSubfolders || hasFiles)
            return Conflict("A organização não está vazia.");

        var rootFolder = await db.Folders.SingleOrDefaultAsync(f => f.Id == organization.RootFolderId);
        if (rootFolder is not null) db.Folders.Remove(rootFolder);

        db.Organizations.Remove(organization);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static OrganizationDto ToDto(Organization o) => new(o.Id, o.Name, o.RootFolderId, o.CreatedAt);
}
