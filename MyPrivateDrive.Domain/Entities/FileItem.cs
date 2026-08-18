namespace MyPrivateDrive.Domain.Entities;

public class FileItem
{
    public Guid Id { get; set; }
    public string OriginalName { get; set; } = default!;
    public string StoredName { get; set; } = default!;
    public long SizeBytes { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? FolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
