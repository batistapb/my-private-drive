namespace MyPrivateDrive.Application.Organizations;

public record OrganizationDto(Guid Id, string Name, Guid RootFolderId, DateTime CreatedAt);

public record CreateOrganizationRequest(string Name);

public record FolderTreeNodeDto(Guid Id, string Name, IReadOnlyList<FolderTreeNodeDto> Children);
