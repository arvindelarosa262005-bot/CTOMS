using CTOMS.Application.Features.Audit.Dtos;
using CTOMS.Application.Features.Auth;
using CTOMS.Application.Features.Dashboard.Dtos;
using CTOMS.Application.Features.Envelopes.Dtos;
using CTOMS.Application.Features.Gis.Dtos;
using CTOMS.Application.Features.Notifications.Dtos;
using CTOMS.Application.Features.Reports.Dtos;
using CTOMS.Application.Features.Sessions.Dtos;
using CTOMS.Application.Features.Settings.Dtos;
using CTOMS.Application.Features.Transactions.Dtos;
using CTOMS.Application.Features.Users.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Realtime;
using CTOMS.Infrastructure.Security;
using CTOMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CTOMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=ctoms;Username=postgres;Password=postgres";

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuditQueryService, AuditQueryService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEnvelopeService, EnvelopeService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IGisService, GisService>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<TokenService>();
        services.AddScoped<ITokenService>(sp => sp.GetRequiredService<TokenService>());
        services.AddScoped<ITokenValidationHelper>(sp => sp.GetRequiredService<TokenService>());
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IRealtimeService, RealtimeService>();
        services.AddHttpContextAccessor();

        services.AddSignalR();

        return services;
    }
}
