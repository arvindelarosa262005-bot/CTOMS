using CTOMS.Application.Common;
using CTOMS.Application.Features.Users.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _audit;
    private readonly ICurrentUserService _currentUser;

    public UserService(AppDbContext db, IPasswordHasher passwordHasher, IAuditService audit, ICurrentUserService currentUser)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _audit = audit;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<PagedResult<UserDto>>> GetAllAsync(UserQuery query, CancellationToken ct = default)
    {
        var q = _db.Users.Include(u => u.Role).AsNoTracking().AsQueryable();
        if (query.IncludeArchived == true)
            q = q.IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(u => u.FullName.ToLower().Contains(s) || u.Username.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
        }
        if (query.RoleId.HasValue)
            q = q.Where(u => u.RoleId == query.RoleId.Value);

        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(u => u.FullName)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .ToListAsync(ct);

        return ApiResponse<PagedResult<UserDto>>.Ok(new PagedResult<UserDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username, ct))
            return ApiResponse<UserDto>.Fail("Username is already taken.");
        if (await _db.Users.AnyAsync(u => u.Email == request.Email, ct))
            return ApiResponse<UserDto>.Fail("Email is already in use.");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId, ct);
        if (role is null)
            return ApiResponse<UserDto>.Fail("Invalid role.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            RoleId = role.Id,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin created user", "User", details: $"User '{user.Username}' created with role '{role.Name}'",
            affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);

        return ApiResponse<UserDto>.Ok(ToDto(user), "User created.");
    }

    public async Task<ApiResponse<UserDto>> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return ApiResponse<UserDto>.Fail("User not found.");

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim();
        user.RoleId = request.RoleId;
        user.Status = (UserStatus)request.Status;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin updated user", "User", details: $"User '{user.Username}' updated",
            affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);

        return ApiResponse<UserDto>.Ok(ToDto(user), "User updated.");
    }

    public async Task<ApiResponse<bool>> SetStatusAsync(Guid id, int status, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");

        user.Status = (UserStatus)status;
        if (status == (int)UserStatus.Disabled)
            user.IsOnline = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin changed user status", "User",
            details: $"User '{user.Username}' status set to {user.Status}",
            affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, "User status updated.");
    }

    public async Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");
        if (_currentUser != null && _currentUser.UserId == id && archived)
            return ApiResponse<bool>.Fail("You cannot archive your own account.");

        user.IsArchived = archived;
        user.ArchivedAt = archived ? DateTime.UtcNow : null;
        if (archived)
            user.IsOnline = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(archived ? "User archived" : "User restored", "User",
            details: $"User '{user.Username}' {(archived ? "archived" : "restored")}",
            affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, archived ? "User archived." : "User restored.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(Guid id, string newPassword, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");

        user.PasswordHash = _passwordHasher.Hash(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin reset user password", "User",
            details: $"Password reset for user '{user.Username}'",
            affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, "Password reset.");
    }

    public async Task<ApiResponse<List<RoleDto>>> GetRolesAsync(CancellationToken ct = default)
    {
        var roles = await _db.Roles.AsNoTracking().OrderBy(r => r.Id).ToListAsync(ct);
        return ApiResponse<List<RoleDto>>.Ok(roles.Select(r => new RoleDto(r.Id, r.Name, r.Description ?? "")).ToList());
    }

    private static UserDto ToDto(User u) =>
        new(u.Id, u.FullName, u.Username, u.Email, u.RoleId, u.Role?.Name ?? "", (int)u.Status,
            u.IsOnline, u.CreatedAt, u.LastLoginAt, u.IsArchived);
}
