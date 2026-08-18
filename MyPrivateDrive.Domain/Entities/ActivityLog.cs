namespace MyPrivateDrive.Domain.Entities;

public class ActivityLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = default!;
    public string? TargetName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
