using CTOMS.Application.Common;
using CTOMS.Application.Features.Gis.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class GisService : IGisService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public GisService(AppDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<ApiResponse<List<DonorMapDto>>> GetDonorsAsync(DonorMapFilters filters, CancellationToken ct = default)
    {
        var txQ = _db.Transactions
            .AsNoTracking()
            .Where(t => t.Status == TransactionStatus.Completed)
            .AsQueryable();

        if (filters.SessionId.HasValue)
            txQ = txQ.Where(t => t.CollectionSessionId == filters.SessionId.Value);

        if (filters.From.HasValue)
            txQ = txQ.Where(t => t.CreatedAt >= filters.From.Value);

        if (filters.To.HasValue)
            txQ = txQ.Where(t => t.CreatedAt <= filters.To.Value);

        // Aggregate donation volumes per donor (the donor name as recorded in transactions)
        var donorAggs = await txQ
            .GroupBy(t => t.DonorName.Trim())
            .Select(g => new
            {
                Name = g.Key,
                TotalAmount = g.Sum(t => t.TotalAmount),
                TransactionCount = g.Count(),
                LastContributionAt = g.Max(t => t.CreatedAt)
            })
            .ToListAsync(ct);

        // Merge with the tracked Donor records (which hold coordinates).
        // Donors derived purely from transactions (no manual record yet) get null coords.
        var donors = await _db.Donors.AsNoTracking().Where(d => !d.IsArchived).ToListAsync(ct);
        var donorByName = donors.ToDictionary(d => d.Name, StringComparer.OrdinalIgnoreCase);

        var result = new List<DonorMapDto>();
        var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var agg in donorAggs.OrderByDescending(a => a.TotalAmount))
        {
            donorByName.TryGetValue(agg.Name, out var donor);
            seenNames.Add(agg.Name);
            result.Add(new DonorMapDto(
                donor?.Id ?? Guid.Empty,
                agg.Name,
                donor?.Latitude,
                donor?.Longitude,
                agg.TotalAmount,
                agg.TransactionCount,
                agg.LastContributionAt));
        }

        // Include manually-created donors even if they have no contributions yet,
        // so they can be placed on the map before their first transaction.
        foreach (var donor in donors.Where(d => !seenNames.Contains(d.Name)))
        {
            result.Add(new DonorMapDto(
                donor.Id,
                donor.Name,
                donor.Latitude,
                donor.Longitude,
                0m,
                0,
                null));
        }

        return ApiResponse<List<DonorMapDto>>.Ok(result);
    }

    public async Task<ApiResponse<bool>> SetLocationAsync(SetDonorLocationRequest request, CancellationToken ct = default)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ApiResponse<bool>.Fail("Donor name is required.");

        if (request.Latitude < -90 || request.Latitude > 90 || request.Longitude < -180 || request.Longitude > 180)
            return ApiResponse<bool>.Fail("Coordinates are out of range.");

        var donor = await _db.Donors.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Name == name, ct);
        if (donor is null)
        {
            donor = new Donor { Name = name, CreatedAt = DateTime.UtcNow };
            _db.Donors.Add(donor);
        }

        donor.Latitude = request.Latitude;
        donor.Longitude = request.Longitude;
        donor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Updated donor location", "GIS",
            details: $"Set map location for donor '{name}'",
            affectedRecordType: "Donor", affectedRecordId: donor.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, "Location saved.");
    }

    public async Task<ApiResponse<bool>> CreateDonorAsync(CreateDonorRequest request, CancellationToken ct = default)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ApiResponse<bool>.Fail("Donor name is required.");

        var exists = await _db.Donors.AnyAsync(d => d.Name == name, ct);
        if (exists)
            return ApiResponse<bool>.Fail("A donor with that name already exists.");

        _db.Donors.Add(new Donor { Name = name, CreatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Created donor", "GIS",
            details: $"Created donor '{name}'",
            affectedRecordType: "Donor", ct: ct);

        return ApiResponse<bool>.Ok(true, "Donor created.");
    }
}
