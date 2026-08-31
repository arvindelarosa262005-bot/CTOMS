using System;
using CTOMS.Application.Features.Transactions.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Tests;

public static class TestDb
{
    public static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}

public class FakeCurrentUser : ICurrentUserService
{
    public Guid? UserId { get; set; } = Guid.NewGuid();
    public string? Username { get; set; } = "usher";
    public string? Role { get; set; } = "Usher";
    public string? IpAddress { get; set; } = "127.0.0.1";
    public string? DeviceInfo { get; set; } = "test";
    public bool IsAuthenticated => UserId.HasValue;
}

public class FakeRealtime : IRealtimeService
{
    public int Sent { get; private set; }
    public Task SendTransactionCreatedAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendTransactionUpdatedAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendSessionStartedAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendSessionClosedAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendUsherOnlineAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendUsherOfflineAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
    public Task SendDashboardUpdatedAsync(object payload, CancellationToken ct = default) { Sent++; return Task.CompletedTask; }
}

public class FakeAudit : IAuditService
{
    public Task LogAsync(string action, string category, string? details = null,
        string? affectedRecordType = null, string? affectedRecordId = null, CancellationToken ct = default)
        => Task.CompletedTask;
}
