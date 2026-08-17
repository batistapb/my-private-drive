using MyPrivateDrive.Domain.Entities;

namespace MyPrivateDrive.Application.Auth;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
