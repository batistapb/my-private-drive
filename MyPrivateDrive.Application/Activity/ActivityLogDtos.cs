namespace MyPrivateDrive.Application.Activity;

public record ActivityLogDto(Guid Id, string Action, string? TargetName, DateTime CreatedAt);

public record ActivityLogPageDto(IReadOnlyList<ActivityLogDto> Items, int Page, int PageSize, int TotalCount);
