namespace CTOMS.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? DeviceInfo { get; set; }
    public string? IpAddress { get; set; }
    public string? AffectedRecordType { get; set; }
    public string? AffectedRecordId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
