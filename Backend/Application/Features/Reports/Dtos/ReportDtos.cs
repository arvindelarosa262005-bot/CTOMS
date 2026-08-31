using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Reports.Dtos;

public enum ReportType
{
    Daily = 1,
    Weekly = 2,
    Monthly = 3,
    Yearly = 4,
    Session = 5,
    PerUsher = 6,
    TransactionDetail = 7
}

public record ReportRequest(
    ReportType Type,
    DateTime? From,
    DateTime? To,
    Guid? SessionId = null,
    Guid? UsherId = null);

public record ReportLine(
    Guid Id,
    string EnvelopeCode,
    string DonorName,
    decimal Tithes,
    decimal Offering,
    decimal Total,
    string? UsherName,
    string? SessionName,
    DateTime CreatedAt,
    int Status);

public record ReportSummary(
    decimal TotalTithes,
    decimal TotalOffering,
    decimal GrandTotal,
    int TransactionCount,
    int VoidedCount);

public record ReportData(
    ReportRequest Request,
    string ChurchName,
    string ReportTitle,
    DateTime From,
    DateTime To,
    DateTime GeneratedAt,
    string GeneratedBy,
    ReportSummary Summary,
    List<ReportLine> Lines,
    List<UsherSummaryLine>? UsherSummary);

public record UsherSummaryLine(string UsherName, int Count, decimal Tithes, decimal Offering, decimal Total);

public interface IReportService
{
    Task<ApiResponse<ReportData>> BuildAsync(ReportRequest request, CancellationToken ct = default);
    Task<ApiResponse<byte[]>> ExportPdfAsync(ReportRequest request, CancellationToken ct = default);
    Task<ApiResponse<byte[]>> ExportExcelAsync(ReportRequest request, CancellationToken ct = default);
}
