using CTOMS.Application.Common;
using CTOMS.Application.Features.Notifications.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<List<NotificationDto>>> GetMineAsync(int count, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<List<NotificationDto>>.Ok(new List<NotificationDto>());

        var items = await _db.Notifications.AsNoTracking()
            .Where(n => n.RecipientUserId == null || n.RecipientUserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(count)
            .ToListAsync(ct);

        return ApiResponse<List<NotificationDto>>.Ok(items.Select(ToDto).ToList());
    }

    public async Task<ApiResponse<bool>> MarkReadAsync(Guid id, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (n is not null)
        {
            n.IsRead = true;
            await _db.SaveChangesAsync(ct);
        }
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> MarkAllReadAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<bool>.Ok(true);

        var items = await _db.Notifications
            .Where(n => (n.RecipientUserId == null || n.RecipientUserId == userId) && !n.IsRead)
            .ToListAsync(ct);
        foreach (var n in items) n.IsRead = true;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<int>> GetUnreadCountAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<int>.Ok(0);

        var count = await _db.Notifications.AsNoTracking()
            .CountAsync(n => (n.RecipientUserId == null || n.RecipientUserId == userId) && !n.IsRead, ct);
        return ApiResponse<int>.Ok(count);
    }

    private static NotificationDto ToDto(Notification n) =>
        new(n.Id, (int)n.Type, n.Title, n.Message, n.IsRead, n.CreatedAt);
}
