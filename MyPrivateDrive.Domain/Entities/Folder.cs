namespace MyPrivateDrive.Domain.Entities;

public class Folder
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public Guid? ParentFolderId { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? OrganizationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
