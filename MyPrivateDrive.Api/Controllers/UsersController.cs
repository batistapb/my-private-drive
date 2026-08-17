using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Application.Users;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        return Ok(new UserProfileDto(user.Id, user.Email, user.CreatedAt));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            if (await db.Users.AnyAsync(u => u.Email == request.Email && u.Id != user.Id))
                return Conflict("Email já cadastrado.");

            user.Email = request.Email;
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await db.SaveChangesAsync();

        return Ok(new UserProfileDto(user.Id, user.Email, user.CreatedAt));
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        var tokens = db.RefreshTokens.Where(t => t.UserId == user.Id);
        db.RefreshTokens.RemoveRange(tokens);
        db.Users.Remove(user);

        await db.SaveChangesAsync();

        return NoContent();
    }
}
