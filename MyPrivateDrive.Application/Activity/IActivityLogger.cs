namespace MyPrivateDrive.Application.Activity;

public interface IActivityLogger
{
    Task LogAsync(Guid userId, string action, string? targetName = null);
}
