using CTOMS.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace CTOMS.Infrastructure.Realtime;

public class RealtimeService : IRealtimeService
{
    private readonly IHubContext<CTOMSHub> _hub;

    public RealtimeService(IHubContext<CTOMSHub> hub)
    {
        _hub = hub;
    }

    private static readonly string[] FinanceGroups = { "SuperAdmin", "Admin", "Treasurer" };
    private static readonly string[] AllGroups = { "Authenticated" };

    private Task SendToGroupsAsync(string eventName, object payload, string[] groups, CancellationToken ct)
    {
        var tasks = groups.Select(g => _hub.Clients.Group(g).SendAsync(eventName, payload, ct));
        return Task.WhenAll(tasks);
    }

    public Task SendTransactionCreatedAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.TransactionCreated, payload, FinanceGroups, ct);

    public Task SendTransactionUpdatedAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.TransactionUpdated, payload, FinanceGroups, ct);

    public Task SendSessionStartedAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.CollectionSessionStarted, payload, AllGroups, ct);

    public Task SendSessionClosedAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.CollectionSessionClosed, payload, AllGroups, ct);

    public Task SendUsherOnlineAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.UsherOnline, payload, FinanceGroups, ct);

    public Task SendUsherOfflineAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.UsherOffline, payload, FinanceGroups, ct);

    public Task SendDashboardUpdatedAsync(object payload, CancellationToken ct = default)
        => SendToGroupsAsync(SignalREvents.DashboardUpdated, payload, FinanceGroups, ct);
}
