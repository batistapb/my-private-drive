using MyPrivateDrive.Application.Files;

namespace MyPrivateDrive.Application.Folders;

public record FolderDto(Guid Id, string Name, Guid? ParentFolderId, Guid? OrganizationId, DateTime CreatedAt, bool IsFavorite);

public record CreateFolderRequest(string Name, Guid? ParentFolderId);

public record UpdateFolderRequest(string? Name, Guid? ParentFolderId, bool MoveToRoot = false);

public record FolderContentsDto(FolderDto? Folder, IReadOnlyList<FolderDto> Ancestors, IReadOnlyList<FolderDto> Subfolders, IReadOnlyList<FileItemDto> Files);
