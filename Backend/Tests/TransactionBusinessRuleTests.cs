using System;
using System.Threading.Tasks;
using CTOMS.Application.Common;
using CTOMS.Application.Features.Transactions.Dtos;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Services;

namespace CTOMS.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Hash_And_Verify_RoundTrip()
    {
        var hasher = new Infrastructure.Security.PasswordHasher();
        var hash = hasher.Hash("P@ssw0rd!");
        Assert.NotEqual("P@ssw0rd!", hash);
        Assert.True(hasher.Verify("P@ssw0rd!", hash));
        Assert.False(hasher.Verify("wrong", hash));
    }

    [Fact]
    public void Hash_Is_Unique_Per_Call()
    {
        var hasher = new Infrastructure.Security.PasswordHasher();
        Assert.NotEqual(hasher.Hash("same"), hasher.Hash("same"));
    }
}

public class TransactionBusinessRuleTests
{
    private TransactionService CreateService(AppDbContext db, FakeCurrentUser user)
        => new(db, user, new FakeAudit(), new FakeRealtime());

    private async Task<Envelope> AddEnvelopeAsync(AppDbContext db, string code = "ENV-TEST1")
    {
        var e = new Envelope { Code = code, QrToken = "TOKEN-" + code, Status = EnvelopeStatus.Active };
        db.Envelopes.Add(e);
        await db.SaveChangesAsync();
        return e;
    }

    private async Task<CollectionSession> AddActiveSessionAsync(AppDbContext db)
    {
        var s = new CollectionSession
        {
            Name = "Sunday Worship",
            ServiceType = "Sunday Service",
            Date = DateTime.UtcNow.Date,
            Status = SessionStatus.Active
        };
        db.CollectionSessions.Add(s);
        await db.SaveChangesAsync();
        return s;
    }

    [Fact]
    public async Task Create_With_Tithes_And_Offering_Calculates_ServerSide_Total()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session = await AddActiveSessionAsync(db);
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var result = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan Dela Cruz", 1000m, 500m, null, Guid.NewGuid()));

        Assert.True(result.Success);
        Assert.Equal(1500m, result.Data!.TotalAmount);
    }

    [Fact]
    public async Task Create_Rejects_Negative_Tithes()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session = await AddActiveSessionAsync(db);
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var result = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", -1m, 100m, null, Guid.NewGuid()));

        Assert.False(result.Success);
    }

    [Fact]
    public async Task Create_Rejects_Zero_Total()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session = await AddActiveSessionAsync(db);
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var result = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", 0m, 0m, null, Guid.NewGuid()));

        Assert.False(result.Success);
    }

    [Fact]
    public async Task Create_Rejects_Non_Active_Session()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var closed = new CollectionSession { Name = "Past", ServiceType = "x", Date = DateTime.UtcNow.Date, Status = SessionStatus.Closed };
        db.CollectionSessions.Add(closed);
        await db.SaveChangesAsync();
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var result = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, closed.Id, "Juan", 100m, 0m, null, Guid.NewGuid()));

        Assert.False(result.Success);
    }

    [Fact]
    public async Task Create_Blocks_Duplicate_Envelope_In_Same_Session()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session = await AddActiveSessionAsync(db);
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var first = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", 1000m, 500m, null, Guid.NewGuid()));
        Assert.True(first.Success);

        var second = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", 200m, 300m, null, Guid.NewGuid()));
        Assert.False(second.Success);
    }

    [Fact]
    public async Task Create_Allows_Same_Envelope_In_Future_Session()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session1 = await AddActiveSessionAsync(db);
        var session2 = new CollectionSession { Name = "Next Week", ServiceType = "x", Date = DateTime.UtcNow.Date.AddDays(7), Status = SessionStatus.Active };
        db.CollectionSessions.Add(session2);
        await db.SaveChangesAsync();
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });

        var first = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session1.Id, "Juan", 1000m, 0m, null, Guid.NewGuid()));
        Assert.True(first.Success);

        var second = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session2.Id, "Juan", 1000m, 0m, null, Guid.NewGuid()));
        Assert.True(second.Success);
    }

    [Fact]
    public async Task Create_With_Same_UUID_Is_Idempotent_Prevents_Duplicate()
    {
        using var db = TestDb.CreateDb();
        var envelope = await AddEnvelopeAsync(db);
        var session = await AddActiveSessionAsync(db);
        var service = CreateService(db, new FakeCurrentUser { Role = "Usher" });
        var uuid = Guid.NewGuid();

        var first = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", 1000m, 0m, null, uuid));
        Assert.True(first.Success);

        var second = await service.CreateAsync(new CreateTransactionRequest(
            envelope.Id, session.Id, "Juan", 1000m, 0m, null, uuid));
        Assert.True(second.Success);
        Assert.Single(db.Transactions);
    }
}
