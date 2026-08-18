namespace MyPrivateDrive.Application.Search;

public record SearchResultDto(Guid Id, string Name, string Type, Guid? ParentFolderId, IReadOnlyList<string> PathNames);
