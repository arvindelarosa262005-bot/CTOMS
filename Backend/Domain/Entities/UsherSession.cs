namespace CTOMS.Domain.Entities;

public class UsherSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsherId { get; set; }
    public User? Usher { get; set; }
    public Guid? CollectionSessionId { get; set; }
    public CollectionSession? CollectionSession { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
