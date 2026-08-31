namespace CTOMS.Domain.Entities;

public enum UserStatus
{
    Active = 1,
    Disabled = 2,
    Pending = 3
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public bool IsOnline { get; set; }
    public string? DeviceInfo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<UsherSession> UsherSessions { get; set; } = new List<UsherSession>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
