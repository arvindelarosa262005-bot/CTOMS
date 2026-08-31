using CTOMS.Application.Features.Envelopes.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnvelopesController : ControllerBase
{
    private readonly IEnvelopeService _envelopes;

    public EnvelopesController(IEnvelopeService envelopes)
    {
        _envelopes = envelopes;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAll([FromQuery] EnvelopeQuery query, CancellationToken ct)
        => Ok(await _envelopes.QueryEnvelopesAsync(query, ct));

    [HttpPost("generate")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Generate([FromBody] CreateEnvelopesRequest request, CancellationToken ct)
        => Ok(await _envelopes.CreateEnvelopesAsync(request, ct));

    [HttpGet("{id:guid}/qr")]
    public async Task<IActionResult> GetQr(Guid id, CancellationToken ct)
    {
        var result = await _envelopes.GetQrAsync(id, ct);
        if (!result.Success)
            return BadRequest(result);
        return Ok(new { qrPngBase64 = result.Data!.QrPngBase64, envelope = result.Data.Envelope });
    }

    [HttpPost("scan")]
    public async Task<IActionResult> Scan([FromBody] ScanRequest request, CancellationToken ct)
        => Ok(await _envelopes.ScanAsync(request.QrToken, request.SessionId, ct));

    [HttpPatch("{id:guid}/status/{activate:bool}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetStatus(Guid id, bool activate, CancellationToken ct)
        => Ok(await _envelopes.SetStatusAsync(id, activate, ct));

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetArchived(Guid id, [FromQuery] bool archived, CancellationToken ct)
        => Ok(await _envelopes.SetArchivedAsync(id, archived, ct));
}

public record ScanRequest(string QrToken, Guid? SessionId);
