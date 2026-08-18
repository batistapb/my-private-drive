namespace MyPrivateDrive.Application.Trash;

public record TrashItemDto(Guid Id, string Name, string Type, DateTime DeletedAt);
