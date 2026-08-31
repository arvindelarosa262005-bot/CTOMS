using CTOMS.Application.Features.Gis.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GisController : ControllerBase
{
    private readonly IGisService _gis;

    public GisController(IGisService gis)
    {
        _gis = gis;
    }

    [HttpGet("donors")]
    public async Task<IActionResult> GetDonors([FromQuery] Guid? sessionId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(await _gis.GetDonorsAsync(new DonorMapFilters(sessionId, from, to), ct));

    [HttpPost("donors")]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> CreateDonor([FromBody] CreateDonorRequest request, CancellationToken ct)
        => Ok(await _gis.CreateDonorAsync(request, ct));

    [HttpPut("donors/location")]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> SetLocation([FromBody] SetDonorLocationRequest request, CancellationToken ct)
        => Ok(await _gis.SetLocationAsync(request, ct));
}
