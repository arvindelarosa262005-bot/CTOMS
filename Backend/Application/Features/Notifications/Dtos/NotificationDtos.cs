using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Notifications.Dtos;

public record NotificationDto(Guid Id, int Type, string Title, string Message, bool IsRead, DateTime CreatedAt);

public interface INotificationService
{
    Task<ApiResponse<List<NotificationDto>>> GetMineAsync(int count, CancellationToken ct = default);
    Task<ApiResponse<bool>> MarkReadAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<bool>> MarkAllReadAsync(CancellationToken ct = default);
    Task<ApiResponse<int>> GetUnreadCountAsync(CancellationToken ct = default);
}
