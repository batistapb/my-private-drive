namespace MyPrivateDrive.Application.Favorites;

public record FavoriteItemDto(Guid Id, string Name, string Type, Guid? ParentFolderId);
