using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyPrivateDrive.Application.Auth;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(AppDbContext db, ITokenService tokenService, IOptions<JwtSettings> jwtOptions) : ControllerBase
{
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict("Email já cadastrado.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(await IssueTokensAsync(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized();

        return Ok(await IssueTokensAsync(user));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var storedToken = await db.RefreshTokens
            .SingleOrDefaultAsync(t => t.Token == request.RefreshToken);

        if (storedToken is null || storedToken.RevokedAt is not null || storedToken.ExpiresAt < DateTime.UtcNow)
            return Unauthorized();

        var user = await db.Users.FindAsync(storedToken.UserId);
        if (user is null)
            return Unauthorized();

        storedToken.RevokedAt = DateTime.UtcNow;

        return Ok(await IssueTokensAsync(user));
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var accessToken = tokenService.GenerateAccessToken(user);
        var refreshToken = tokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        });

        await db.SaveChangesAsync();

        return new AuthResponse(accessToken, refreshToken);
    }
}
