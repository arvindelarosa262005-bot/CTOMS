using CTOMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<CollectionSession> CollectionSessions => Set<CollectionSession>();
    public DbSet<Envelope> Envelopes => Set<Envelope>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ChurchSetting> ChurchSettings => Set<ChurchSetting>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UsherSession> UsherSessions => Set<UsherSession>();
    public DbSet<Donor> Donors => Set<Donor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Type).IsUnique();
            e.HasMany(x => x.Users).WithOne(u => u.Role).HasForeignKey(u => u.RoleId);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsArchived);
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.PasswordHash).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Token).HasMaxLength(500).IsRequired();
            e.HasIndex(x => x.Token).IsUnique();
            e.Property(x => x.JwtId).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<CollectionSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsArchived);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.ServiceType).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.Date, x.Name });
        });

        modelBuilder.Entity<Envelope>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsArchived);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.QrToken).HasMaxLength(200).IsRequired();
            e.Property(x => x.MemberName).HasMaxLength(200);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.QrToken).IsUnique();
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsArchived);
            e.Property(x => x.DonorName).HasMaxLength(200).IsRequired();
            e.Property(x => x.TithesAmount).HasPrecision(18, 2);
            e.Property(x => x.OfferingAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.Notes).HasMaxLength(500);
            e.Property(x => x.VoidReason).HasMaxLength(500);
            e.HasIndex(x => x.TransactionUUID).IsUnique();

            e.HasIndex(x => new { x.EnvelopeId, x.CollectionSessionId });

            e.HasOne(x => x.Envelope).WithMany(env => env.Transactions).HasForeignKey(x => x.EnvelopeId);
            e.HasOne(x => x.CollectionSession).WithMany(cs => cs.Transactions).HasForeignKey(x => x.CollectionSessionId);
            e.HasOne(x => x.Usher).WithMany(u => u.Transactions).HasForeignKey(x => x.UsherId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.VoidedBy).WithMany().HasForeignKey(x => x.VoidedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).HasMaxLength(200).IsRequired();
            e.Property(x => x.Category).HasMaxLength(100);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.DeviceInfo).HasMaxLength(300);
            e.Property(x => x.IpAddress).HasMaxLength(100);
            e.Property(x => x.AffectedRecordType).HasMaxLength(100);
            e.Property(x => x.AffectedRecordId).HasMaxLength(100);
        });

        modelBuilder.Entity<ChurchSetting>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<UsherSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Usher).WithMany(u => u.UsherSessions).HasForeignKey(x => x.UsherId);
            e.HasOne(x => x.CollectionSession).WithMany().HasForeignKey(x => x.CollectionSessionId).IsRequired(false);
        });

        modelBuilder.Entity<Donor>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasQueryFilter(x => !x.IsArchived);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });
    }
}
