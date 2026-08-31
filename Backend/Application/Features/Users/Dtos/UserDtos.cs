using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Users.Dtos;

public record UserDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    int RoleId,
    string RoleName,
    int Status,
    bool IsOnline,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    bool IsArchived);

public record CreateUserRequest(string FullName, string Username, string Email, string Password, int RoleId);

public record UpdateUserRequest(string FullName, string Email, int RoleId, int Status);

public record ResetPasswordRequest(Guid UserId, string NewPassword);

public record UserQuery(int Page = 1, int PageSize = 20, string? Search = null, int? RoleId = null, bool? IncludeArchived = null);

public record RoleDto(int Id, string Name, string Description);

public interface IUserService
{
    Task<ApiResponse<PagedResult<UserDto>>> GetAllAsync(UserQuery query, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetStatusAsync(Guid id, int status, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default);
    Task<ApiResponse<bool>> ResetPasswordAsync(Guid id, string newPassword, CancellationToken ct = default);
    Task<ApiResponse<List<RoleDto>>> GetRolesAsync(CancellationToken ct = default);
}
