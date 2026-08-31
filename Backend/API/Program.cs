using CTOMS.Application.Features.Auth;
using CTOMS.Infrastructure;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Realtime;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().ConfigureApiBehaviorOptions(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState.Values.SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage).ToList();
        return new BadRequestObjectResult(new
        {
            success = false,
            message = "Invalid request.",
            errors
        });
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

// Core CORS policy
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://192.168.8.142:5173" };
builder.Services.AddCors(o =>
{
    o.AddPolicy("CTOMSCors", p =>
    {
        p.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Rate limiting
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddFixedWindowLimiter("fixed", options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueLimit = 0;
    });
    o.AddFixedWindowLimiter("auth", options =>
    {
        options.PermitLimit = 10;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueLimit = 0;
    });
});

var app = builder.Build();

// Apply migrations first (best-effort; may be skipped until DB is reachable)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
catch (Exception ex)
{
    app.Logger.LogWarning("Migration skipped. Ensure PostgreSQL is available: {Message}", ex.Message);
}

// Seed data on startup (best-effort; runs only if migration succeeded)
try
{
    using var scope = app.Services.CreateScope();
    var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
    await auth.SeedAsync();
}
catch (Exception ex)
{
    app.Logger.LogWarning("Seeding skipped: {Message}", ex.Message);
}

app.UseCors("CTOMSCors");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<CTOMSHub>("/hubs/ctoms");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("CTOMS API");
    });
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.Run();

public partial class Program { }

