using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CTOMS.Infrastructure.Realtime;

[Authorize]
public class CTOMSHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, role);
            await Groups.AddToGroupAsync(Context.ConnectionId, "Authenticated");
        }

        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            await Clients.Others.SendAsync("UsherOnline", new { username, at = DateTime.UtcNow });
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            await Clients.Others.SendAsync("UsherOffline", new { username, at = DateTime.UtcNow });
        }
        await base.OnDisconnectedAsync(exception);
    }
}
