namespace CTOMS.Domain.Entities;

public enum EnvelopeStatus
{
    Active = 1,
    Disabled = 2
}

public class Envelope
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;        // e.g. "ENV-A7K29X4"
    public string QrToken { get; set; } = string.Empty;     // secure random token stored inside QR
    public string? MemberName { get; set; }                 // optional, used for smart history hint
    public EnvelopeStatus Status { get; set; } = EnvelopeStatus.Active;
    public Guid? AssignedToMemberId { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DisabledAt { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
