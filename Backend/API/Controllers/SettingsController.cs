using CTOMS.Application.Features.Settings.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settings;

    public SettingsController(ISettingsService settings)
    {
        _settings = settings;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await _settings.GetAsync(ct));

    [HttpPut]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update([FromBody] UpdateChurchSettingsRequest request, CancellationToken ct)
        => Ok(await _settings.UpdateAsync(request, ct));

    [HttpPost("backup")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Backup(CancellationToken ct)
        => Ok(await _settings.CreateBackupAsync(ct));
}
