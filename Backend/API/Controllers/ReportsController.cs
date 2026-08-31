using CTOMS.Application.Features.Reports.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports)
    {
        _reports = reports;
    }

    [HttpPost("build")]
    public async Task<IActionResult> Build([FromBody] ReportRequest request, CancellationToken ct)
        => Ok(await _reports.BuildAsync(request, ct));

    [HttpPost("pdf")]
    public async Task<IActionResult> Pdf([FromBody] ReportRequest request, CancellationToken ct)
    {
        var result = await _reports.ExportPdfAsync(request, ct);
        if (!result.Success)
            return BadRequest(result);
        var file = BuildFilename(request, "pdf");
        return File(result.Data!, "application/pdf", file);
    }

    [HttpPost("excel")]
    public async Task<IActionResult> Excel([FromBody] ReportRequest request, CancellationToken ct)
    {
        var result = await _reports.ExportExcelAsync(request, ct);
        if (!result.Success)
            return BadRequest(result);
        var file = BuildFilename(request, "xlsx");
        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", file);
    }

    private static string BuildFilename(ReportRequest request, string ext)
    {
        var type = request.Type.ToString();
        var stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        return $"CTOMS_{type}_Report_{stamp}.{ext}";
    }
}
