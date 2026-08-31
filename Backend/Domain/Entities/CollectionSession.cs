namespace CTOMS.Domain.Entities;

public enum SessionStatus
{
    Upcoming = 1,
    Active = 2,
    Closed = 3
}

public class CollectionSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.Upcoming;
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
