namespace MyPrivateDrive.Domain.Entities;

public class Organization
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public Guid OwnerId { get; set; }
    public Guid RootFolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
