namespace MyPrivateDrive.Application.Files;

public record FileItemDto(Guid Id, string OriginalName, long SizeBytes, Guid? FolderId, DateTime CreatedAt, string ContentType);
