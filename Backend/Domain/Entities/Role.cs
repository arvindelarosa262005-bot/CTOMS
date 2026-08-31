namespace CTOMS.Domain.Entities;

public enum RoleType
{
    SuperAdmin = 1,
    Admin = 2,
    Treasurer = 3,
    Usher = 4
}

public class Role
{
    public int Id { get; set; }
    public RoleType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<User> Users { get; set; } = new List<User>();
}
