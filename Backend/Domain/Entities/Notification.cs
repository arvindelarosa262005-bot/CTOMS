using CTOMS.Domain.Entities;

namespace CTOMS.Domain.Entities;

public enum NotificationType
{
    Transaction = 1,
    Session = 2,
    System = 3
}

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RecipientUserId { get; set; }
    public User? RecipientUser { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
