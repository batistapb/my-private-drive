namespace MyPrivateDrive.Application.Users;

public record UserProfileDto(Guid Id, string Email, DateTime CreatedAt);

public record UpdateProfileRequest(string? Email, string? Password);
