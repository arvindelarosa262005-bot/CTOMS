namespace CTOMS.Application.Interfaces;

public static class SignalREvents
{
    public const string TransactionCreated = "TransactionCreated";
    public const string TransactionUpdated = "TransactionUpdated";
    public const string CollectionSessionStarted = "CollectionSessionStarted";
    public const string CollectionSessionClosed = "CollectionSessionClosed";
    public const string UsherOnline = "UsherOnline";
    public const string UsherOffline = "UsherOffline";
    public const string DashboardUpdated = "DashboardUpdated";
}

public interface IRealtimeService
{
    Task SendTransactionCreatedAsync(object payload, CancellationToken ct = default);
    Task SendTransactionUpdatedAsync(object payload, CancellationToken ct = default);
    Task SendSessionStartedAsync(object payload, CancellationToken ct = default);
    Task SendSessionClosedAsync(object payload, CancellationToken ct = default);
    Task SendUsherOnlineAsync(object payload, CancellationToken ct = default);
    Task SendUsherOfflineAsync(object payload, CancellationToken ct = default);
    Task SendDashboardUpdatedAsync(object payload, CancellationToken ct = default);
}
