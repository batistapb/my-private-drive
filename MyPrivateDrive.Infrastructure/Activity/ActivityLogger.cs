using MyPrivateDrive.Application.Activity;
using MyPrivateDrive.Domain.Entities;
using MyPrivateDrive.Infrastructure.Persistence;

namespace MyPrivateDrive.Infrastructure.Activity;

public class ActivityLogger(AppDbContext db) : IActivityLogger
{
    public async Task LogAsync(Guid userId, string action, string? targetName = null)
    {
        db.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            TargetName = targetName
        });

        await db.SaveChangesAsync();
    }
}
