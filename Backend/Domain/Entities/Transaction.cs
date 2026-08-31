namespace CTOMS.Domain.Entities;

public enum TransactionStatus
{
    Completed = 1,
    Voided = 2
}

public enum SyncStatus
{
    Synced = 1,
    Pending = 2
}

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionUUID { get; set; } = Guid.NewGuid();
    public Guid EnvelopeId { get; set; }
    public Envelope? Envelope { get; set; }
    public Guid CollectionSessionId { get; set; }
    public CollectionSession? CollectionSession { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public decimal TithesAmount { get; set; }
    public decimal OfferingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public Guid UsherId { get; set; }
    public User? Usher { get; set; }
    public Guid? VoidedByUserId { get; set; }
    public User? VoidedBy { get; set; }
    public string? VoidReason { get; set; }
    public DateTime? VoidedAt { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Completed;
    public SyncStatus SyncStatus { get; set; } = SyncStatus.Synced;
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
