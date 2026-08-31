using CTOMS.Application.Common;
using CTOMS.Application.Features.Reports.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CTOMS.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private static readonly HttpClient _http = CreateHttpClient();

    public ReportService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    private static HttpClient CreateHttpClient()
    {
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (m, c, ch, e) => true
        };
        var client = new HttpClient(handler);
        client.Timeout = TimeSpan.FromSeconds(8);
        return client;
    }

    private async Task<byte[]?> LoadLogoAsync(CancellationToken ct)
    {
        try
        {
            var url = await _db.ChurchSettings.AsNoTracking()
                .Where(s => s.Key == "LogoUrl")
                .Select(s => s.Value)
                .FirstOrDefaultAsync(ct);
            if (string.IsNullOrWhiteSpace(url)) return null;
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
            if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) return null;
            using var resp = await _http.GetAsync(uri, ct);
            if (!resp.IsSuccessStatusCode) return null;
            var bytes = await resp.Content.ReadAsByteArrayAsync(ct);
            return bytes.Length > 0 ? bytes : null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<ApiResponse<ReportData>> BuildAsync(ReportRequest request, CancellationToken ct = default)
    {
        var data = await BuildReportDataAsync(request, ct);
        return ApiResponse<ReportData>.Ok(data);
    }

    public async Task<ApiResponse<byte[]>> ExportPdfAsync(ReportRequest request, CancellationToken ct = default)
    {
        var data = await BuildReportDataAsync(request, ct);
        var logo = await LoadLogoAsync(ct);
        var pdf = BuildPdf(data, logo);
        await LogExportAsync("PDF", request, ct);
        return ApiResponse<byte[]>.Ok(pdf);
    }

    public async Task<ApiResponse<byte[]>> ExportExcelAsync(ReportRequest request, CancellationToken ct = default)
    {
        var data = await BuildReportDataAsync(request, ct);
        var excel = BuildExcel(data);
        await LogExportAsync("Excel", request, ct);
        return ApiResponse<byte[]>.Ok(excel);
    }

    private async Task<ReportData> BuildReportDataAsync(ReportRequest request, CancellationToken ct)
    {
        var (from, to) = ResolveRange(request.Type, request.From, request.To);

        var q = _db.Transactions.AsNoTracking()
            .Include(t => t.Envelope).Include(t => t.CollectionSession).Include(t => t.Usher)
            .Where(t => t.CreatedAt >= from && t.CreatedAt <= to)
            .AsQueryable();

        if (request.SessionId.HasValue)
            q = q.Where(t => t.CollectionSessionId == request.SessionId.Value);
        if (request.UsherId.HasValue)
            q = q.Where(t => t.UsherId == request.UsherId.Value);

        var lines = await q.OrderBy(t => t.CreatedAt).ToListAsync(ct);

        var summary = new ReportSummary(
            lines.Where(l => l.Status == TransactionStatus.Completed).Sum(l => l.TithesAmount),
            lines.Where(l => l.Status == TransactionStatus.Completed).Sum(l => l.OfferingAmount),
            lines.Where(l => l.Status == TransactionStatus.Completed).Sum(l => l.TotalAmount),
            lines.Count(l => l.Status == TransactionStatus.Completed),
            lines.Count(l => l.Status == TransactionStatus.Voided));

        var usherSummary = lines.Where(l => l.Status == TransactionStatus.Completed)
            .GroupBy(l => l.Usher?.FullName ?? "Unknown")
            .Select(g => new UsherSummaryLine(g.Key, g.Count(), g.Sum(x => x.TithesAmount), g.Sum(x => x.OfferingAmount), g.Sum(x => x.TotalAmount)))
            .ToList();

        var church = await GetChurchNameAsync(ct);
        var title = GetTitle(request.Type, from, to);

        return new ReportData(request, church, title, from, to, DateTime.UtcNow,
            _currentUser.Username ?? "System",
            summary,
            lines.Select(l => new ReportLine(
                l.Id, l.Envelope?.Code ?? "", l.DonorName, l.TithesAmount, l.OfferingAmount,
                l.TotalAmount, l.Usher?.FullName, l.CollectionSession?.Name, l.CreatedAt, (int)l.Status)).ToList(),
            usherSummary);
    }

    private (DateTime from, DateTime to) ResolveRange(ReportType type, DateTime? from, DateTime? to)
    {
        var now = DateTime.UtcNow;
        return type switch
        {
            ReportType.Daily => (now.Date, now.Date.AddDays(1).AddTicks(-1)),
            ReportType.Weekly => (now.Date.AddDays(-(int)now.DayOfWeek), now.Date.AddDays(-(int)now.DayOfWeek + 7).AddTicks(-1)),
            ReportType.Monthly => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1)),
            ReportType.Yearly => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 1, 1).AddYears(1).AddTicks(-1)),
            _ => (from ?? now.Date, (to ?? now).AddTicks(-1))
        };
    }

    private static string GetTitle(ReportType type, DateTime from, DateTime to) => type switch
    {
        ReportType.Daily => $"Daily Collection Report ({from:d})",
        ReportType.Weekly => $"Weekly Collection Report ({from:d} - {to:d})",
        ReportType.Monthly => $"Monthly Collection Report ({from:MMMM yyyy})",
        ReportType.Yearly => $"Yearly Collection Report ({from:yyyy})",
        ReportType.Session => "Collection Session Report",
        ReportType.PerUsher => "Per Usher Report",
        _ => "Transaction Detail Report"
    };

    private async Task<string> GetChurchNameAsync(CancellationToken ct)
    {
        var name = await _db.ChurchSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == "ChurchName", ct);
        return name?.Value ?? "Church";
    }

    private async Task LogExportAsync(string format, ReportRequest request, CancellationToken ct)
    {
        var details = $"Exported {GetTitle(request.Type, DateTime.UtcNow, DateTime.UtcNow)} as {format}";
        _ = Task.Run(async () =>
        {
            try
            {
                var log = new AuditLog
                {
                    UserId = _currentUser.UserId,
                    Action = "Admin exported Report",
                    Category = "Report",
                    Details = details,
                    DeviceInfo = _currentUser.DeviceInfo,
                    IpAddress = _currentUser.IpAddress,
                    CreatedAt = DateTime.UtcNow
                };
                await _db.AuditLogs.AddAsync(log);
                await _db.SaveChangesAsync();
            }
            catch { }
        }, ct);
    }

    private byte[] BuildPdf(ReportData data, byte[]? logo = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var isWide = data.Lines.Count > 20;
        var blue = Colors.Blue.Darken2;
        var blueDark = Colors.Blue.Darken4;
        var blueLight = Colors.Blue.Lighten5;
        var rowGrey = Colors.Grey.Lighten4;

        var doc = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(isWide ? PageSizes.Letter.Landscape() : PageSizes.Letter);
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Grey.Darken3));

                // ---------- HEADER ----------
                page.Header().Column(col =>
                {
                    // Brand banner with logo
                    col.Item().Background(blue).PaddingVertical(12).PaddingHorizontal(16).Row(r =>
                    {
                        if (logo != null)
                        {
                            r.AutoItem().Width(54).Height(54).PaddingRight(12).AlignCenter().AlignMiddle()
                                .Border(2).BorderColor(Colors.White).Background(Colors.White)
                                .Padding(2).Image(logo).FitArea();
                        }
                        r.RelativeItem().AlignCenter().AlignMiddle().Column(t =>
                        {
                            t.Item().Text(data.ChurchName)
                                .FontColor(Colors.White).FontSize(19).Bold();
                            t.Item().PaddingTop(2).Text(data.ReportTitle)
                                .FontColor(Colors.Blue.Lighten3).FontSize(12).SemiBold();
                            t.Item().PaddingTop(4).Text($"{data.From:MMMM d, yyyy} to {data.To:MMMM d, yyyy}")
                                .FontColor(Colors.White).FontSize(9);
                        });
                    });

                    // Generated line
                    col.Item().PaddingTop(6).Row(r =>
                    {
                        r.RelativeItem().Text(text =>
                        {
                            text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Darken1));
                            text.Span("Generated: ").SemiBold();
                            text.Span($"{data.GeneratedAt:g} by {data.GeneratedBy}");
                        });
                        r.RelativeItem().AlignRight().Text("CASH COLLECTION REPORT").Bold()
                            .FontColor(blue).FontSize(8);
                    });
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(blueLight);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    // ---------- SUMMARY STATS ----------
                    col.Item().PaddingBottom(12).Row(row =>
                    {
                        void stat(string label, string value, bool highlight = false)
                        {
                            row.RelativeItem().PaddingRight(6).Column(c =>
                            {
                                c.Item().Background(highlight ? blue : Colors.Grey.Lighten3)
                                    .Padding(8).Text(label).FontColor(highlight ? Colors.White : Colors.Grey.Darken2)
                                    .FontSize(9).Bold();
                                c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.White)
                                    .Padding(8).Text(value).FontColor(highlight ? blue : Colors.Grey.Darken3)
                                    .FontSize(14).Bold().AlignCenter();
                            });
                        }

                        stat("TOTAL TITHES", "₱ " + data.Summary.TotalTithes.ToString("N2"));
                        stat("TOTAL OFFERING", "₱ " + data.Summary.TotalOffering.ToString("N2"));
                        stat("GRAND TOTAL", "₱ " + data.Summary.GrandTotal.ToString("N2"), true);
                    });

                    col.Item().PaddingBottom(12).Row(row =>
                    {
                        row.RelativeItem().PaddingRight(6).Column(c =>
                        {
                            c.Item().Background(Colors.Grey.Lighten3).Padding(8)
                                .Text("Completed Transactions").FontColor(Colors.Grey.Darken2).FontSize(9).Bold();
                            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.White)
                                .Padding(8).Text(data.Summary.TransactionCount.ToString()).FontColor(Colors.Grey.Darken3)
                                .FontSize(14).Bold().AlignCenter();
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Background(Colors.Grey.Lighten3).Padding(8)
                                .Text("Voided Transactions").FontColor(Colors.Grey.Darken2).FontSize(9).Bold();
                            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.White)
                                .Padding(8).Text(data.Summary.VoidedCount.ToString()).FontColor(Colors.Red.Darken1)
                                .FontSize(14).Bold().AlignCenter();
                        });
                    });

                    // ---------- DETAILED TRANSACTIONS ----------
                    col.Item().PaddingBottom(6).Text("Detailed Transactions")
                        .FontSize(12).SemiBold().FontColor(blueDark);

                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(24);
                            c.ConstantColumn(52);
                            c.ConstantColumn(64);
                            c.RelativeColumn(1.5f);
                            c.ConstantColumn(isWide ? 62 : 58);
                            c.ConstantColumn(isWide ? 62 : 58);
                            c.ConstantColumn(isWide ? 62 : 58);
                            if (isWide) c.RelativeColumn(1.1f);
                            c.ConstantColumn(48);
                        });

                        t.Header(h =>
                        {
                            void hdr(QuestPDF.Elements.Table.ITableCellContainer cell, string text)
                            {
                                cell.Background(blue).Padding(5)
                                    .Text(text).FontColor(Colors.White).Bold().FontSize(8).AlignCenter();
                            }

                            hdr(h.Cell(), "#");
                            hdr(h.Cell(), "Date");
                            hdr(h.Cell(), "Envelope");
                            hdr(h.Cell(), "Donor Name");
                            hdr(h.Cell(), "Tithes");
                            hdr(h.Cell(), "Offering");
                            hdr(h.Cell(), "Total");
                            if (isWide) hdr(h.Cell(), "Session");
                            hdr(h.Cell(), "Status");
                        });

                        var idx = 0;
                        foreach (var line in data.Lines)
                        {
                            idx++;
                            var bg = idx % 2 == 0 ? rowGrey : Colors.White;
                            t.Cell().Background(bg).Padding(4).Text(idx.ToString()).AlignCenter().FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.CreatedAt.ToLocalTime().ToString("MM/dd/yy")).AlignCenter().FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.EnvelopeCode).AlignCenter().FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.DonorName).FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.Tithes.ToString("N2")).AlignRight().FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.Offering.ToString("N2")).AlignRight().FontSize(8);
                            t.Cell().Background(bg).Padding(4).Text(line.Total.ToString("N2")).AlignRight().FontSize(8).Bold();
                            if (isWide) t.Cell().Background(bg).Padding(4).Text(line.SessionName ?? "").FontSize(8);
                            var statusTxt = line.Status == (int)TransactionStatus.Voided ? "VOIDED" : "OK";
                            t.Cell().Background(bg).Padding(4).Text(statusTxt)
                                .FontColor(line.Status == (int)TransactionStatus.Voided ? Colors.Red.Darken1 : Colors.Green.Darken1)
                                .AlignCenter().FontSize(8).Bold();
                        }

                        // TOTAL row
                        if (idx > 0)
                        {
                            t.Cell().Background(blueLight).Padding(5).Text("").FontSize(8);
                            t.Cell().Background(blueLight).Padding(5).Text("").FontSize(8);
                            t.Cell().Background(blueLight).Padding(5).Text("").FontSize(8);
                            t.Cell().Background(blueLight).Padding(5).Text("TOTAL").FontSize(8).Bold().FontColor(blueDark);
                            t.Cell().Background(blueLight).Padding(5).Text(data.Summary.TotalTithes.ToString("N2")).AlignRight().FontSize(8).Bold().FontColor(blueDark);
                            t.Cell().Background(blueLight).Padding(5).Text(data.Summary.TotalOffering.ToString("N2")).AlignRight().FontSize(8).Bold().FontColor(blueDark);
                            t.Cell().Background(blueLight).Padding(5).Text(data.Summary.GrandTotal.ToString("N2")).AlignRight().FontSize(8).Bold().FontColor(blueDark);
                            if (isWide) t.Cell().Background(blueLight).Padding(5).Text("").FontSize(8);
                            t.Cell().Background(blueLight).Padding(5).Text("").FontSize(8);
                        }
                    });

                    // ---------- USHER SUMMARY ----------
                    if (data.UsherSummary != null && data.UsherSummary.Count > 0 && data.UsherSummary.Sum(u => u.Count) > 0)
                    {
                        col.Item().PaddingTop(12).PaddingBottom(6).Text("Usher Summary")
                            .FontSize(12).SemiBold().FontColor(blueDark);
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2f);
                                c.RelativeColumn(1f);
                                c.RelativeColumn(1f);
                                c.RelativeColumn(1f);
                                c.RelativeColumn(1f);
                            });
                            t.Header(h =>
                            {
                                h.Cell().Background(blue).Padding(5).Text("Usher").FontColor(Colors.White).Bold().FontSize(8);
                                h.Cell().Background(blue).Padding(5).Text("Count").FontColor(Colors.White).Bold().FontSize(8).AlignCenter();
                                h.Cell().Background(blue).Padding(5).Text("Tithes").FontColor(Colors.White).Bold().FontSize(8).AlignRight();
                                h.Cell().Background(blue).Padding(5).Text("Offering").FontColor(Colors.White).Bold().FontSize(8).AlignRight();
                                h.Cell().Background(blue).Padding(5).Text("Total").FontColor(Colors.White).Bold().FontSize(8).AlignRight();
                            });
                            var ui = 0;
                            foreach (var u in data.UsherSummary)
                            {
                                ui++;
                                var bg = ui % 2 == 0 ? rowGrey : Colors.White;
                                t.Cell().Background(bg).Padding(4).Text(u.UsherName).FontSize(8);
                                t.Cell().Background(bg).Padding(4).Text(u.Count.ToString()).AlignCenter().FontSize(8);
                                t.Cell().Background(bg).Padding(4).Text(u.Tithes.ToString("N2")).AlignRight().FontSize(8);
                                t.Cell().Background(bg).Padding(4).Text(u.Offering.ToString("N2")).AlignRight().FontSize(8);
                                t.Cell().Background(bg).Padding(4).Text(u.Total.ToString("N2")).AlignRight().FontSize(8).Bold();
                            }
                        });
                    }

                    // ---------- SIGNATURES ----------
                    // ---------- SIGNATURES ----------
                    col.Item().PaddingTop(28).Column(sig =>
                    {
                        sig.Item().Text("Prepared By:").FontSize(9).SemiBold();
                        sig.Item().PaddingTop(22).Text("______________________").FontSize(9);
                        sig.Item().PaddingTop(2).Text("Printed Name / Signature").FontColor(Colors.Grey.Darken1).FontSize(7);
                    });
                });

                // ---------- FOOTER ----------
                page.Footer().Column(f =>
                {
                    f.Item().LineHorizontal(0.5f).LineColor(blueLight);
                    f.Item().PaddingTop(4).Row(r =>
                    {
                        r.RelativeItem().Text("Developed by Bro Arrvin dela Rosa")
                            .FontColor(Colors.Grey.Darken1).FontSize(8);
                        r.RelativeItem().AlignRight().Text(text =>
                        {
                            text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Darken1));
                            text.Span("CTOMS — Church Tithes & Offering Management System | Page ");
                            text.CurrentPageNumber();
                            text.Span(" of ");
                            text.TotalPages();
                        });
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }

    private byte[] BuildExcel(ReportData data)
    {
        using var wb = new XLWorkbook();

        // Sheet 1: Summary
        var summarySheet = wb.Worksheets.Add("Summary");
        summarySheet.Cell(1, 1).Value = data.ChurchName;
        summarySheet.Cell(1, 1).Style.Font.Bold = true;
        summarySheet.Cell(1, 1).Style.Font.FontSize = 16;
        summarySheet.Cell(2, 1).Value = data.ReportTitle;
        summarySheet.Cell(2, 1).Style.Font.Bold = true;
        summarySheet.Cell(3, 1).Value = $"Period: {data.From:d} to {data.To:d}";
        summarySheet.Cell(4, 1).Value = $"Generated: {data.GeneratedAt:g} by {data.GeneratedBy}";

        var summaryRows = new[]
        {
            new { Label = "Total Tithes", Value = (double)data.Summary.TotalTithes, IsMoney = true },
            new { Label = "Total Offering", Value = (double)data.Summary.TotalOffering, IsMoney = true },
            new { Label = "Grand Total", Value = (double)data.Summary.GrandTotal, IsMoney = true },
            new { Label = "Transaction Count", Value = (double)data.Summary.TransactionCount, IsMoney = false },
            new { Label = "Voided Count", Value = (double)data.Summary.VoidedCount, IsMoney = false },
        };

        summarySheet.Cell(6, 1).Value = "Summary";
        summarySheet.Range(6, 1, 6, 2).Style.Font.Bold = true;
        summarySheet.Cell(6, 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        summarySheet.Cell(6, 2).Style.Fill.BackgroundColor = XLColor.LightGray;
        for (int i = 0; i < summaryRows.Length; i++)
        {
            summarySheet.Cell(7 + i, 1).Value = summaryRows[i].Label;
            summarySheet.Cell(7 + i, 2).Value = summaryRows[i].Value;
            if (summaryRows[i].IsMoney)
                summarySheet.Cell(7 + i, 2).Style.NumberFormat.Format = "#,##0.00";
        }
        summarySheet.Columns(1, 2).AdjustToContents();

        // Sheet 2: Transactions
        var txSheet = wb.Worksheets.Add("Transactions");
        var headers = new[] { "#", "Date", "Time", "Envelope", "Donor Name", "Tithes", "Offering", "Total", "Usher", "Collection Session", "Status" };
        for (int c = 0; c < headers.Length; c++)
        {
            txSheet.Cell(1, c + 1).Value = headers[c];
            txSheet.Cell(1, c + 1).Style.Font.Bold = true;
            txSheet.Cell(1, c + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        var idx = 0;
        foreach (var line in data.Lines)
        {
            idx++;
            var r = idx + 1;
            txSheet.Cell(r, 1).Value = idx;
            txSheet.Cell(r, 2).Value = line.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd");
            txSheet.Cell(r, 3).Value = line.CreatedAt.ToLocalTime().ToString("hh:mm tt");
            txSheet.Cell(r, 4).Value = line.EnvelopeCode;
            txSheet.Cell(r, 5).Value = line.DonorName;
            txSheet.Cell(r, 6).Value = (double)line.Tithes;
            txSheet.Cell(r, 7).Value = (double)line.Offering;
            txSheet.Cell(r, 8).Value = (double)line.Total;
            txSheet.Cell(r, 9).Value = line.UsherName ?? "";
            txSheet.Cell(r, 10).Value = line.SessionName ?? "";
            txSheet.Cell(r, 11).Value = line.Status == (int)TransactionStatus.Voided ? "VOIDED" : "Completed";

            txSheet.Cell(r, 6).Style.NumberFormat.Format = "#,##0.00";
            txSheet.Cell(r, 7).Style.NumberFormat.Format = "#,##0.00";
            txSheet.Cell(r, 8).Style.NumberFormat.Format = "#,##0.00";
        }

        if (idx > 0)
        {
            var totalRow = idx + 2;
            txSheet.Cell(totalRow, 5).Value = "TOTAL";
            txSheet.Cell(totalRow, 5).Style.Font.Bold = true;
            txSheet.Cell(totalRow, 6).FormulaA1 = $"SUM(F2:F{idx + 1})";
            txSheet.Cell(totalRow, 7).FormulaA1 = $"SUM(G2:G{idx + 1})";
            txSheet.Cell(totalRow, 8).FormulaA1 = $"SUM(H2:H{idx + 1})";
            txSheet.Cell(totalRow, 6).Style.NumberFormat.Format = "#,##0.00";
            txSheet.Cell(totalRow, 7).Style.NumberFormat.Format = "#,##0.00";
            txSheet.Cell(totalRow, 8).Style.NumberFormat.Format = "#,##0.00";
        }

        txSheet.Columns().AdjustToContents();
        txSheet.RangeUsed()?.SetAutoFilter();
        txSheet.SheetView.FreezeRows(1);

        // Sheet 3: Usher Summary
        var usherSheet = wb.Worksheets.Add("Usher Summary");
        var uHeaders = new[] { "Usher", "Count", "Tithes", "Offering", "Total" };
        for (int c = 0; c < uHeaders.Length; c++)
        {
            usherSheet.Cell(1, c + 1).Value = uHeaders[c];
            usherSheet.Cell(1, c + 1).Style.Font.Bold = true;
            usherSheet.Cell(1, c + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }
        var ui = 0;
        foreach (var u in data.UsherSummary ?? new List<UsherSummaryLine>())
        {
            ui++;
            var r = ui + 1;
            usherSheet.Cell(r, 1).Value = u.UsherName;
            usherSheet.Cell(r, 2).Value = u.Count;
            usherSheet.Cell(r, 3).Value = (double)u.Tithes;
            usherSheet.Cell(r, 4).Value = (double)u.Offering;
            usherSheet.Cell(r, 5).Value = (double)u.Total;
            usherSheet.Cell(r, 3).Style.NumberFormat.Format = "#,##0.00";
            usherSheet.Cell(r, 4).Style.NumberFormat.Format = "#,##0.00";
            usherSheet.Cell(r, 5).Style.NumberFormat.Format = "#,##0.00";
        }
        usherSheet.Columns().AdjustToContents();
        usherSheet.RangeUsed()?.SetAutoFilter();
        usherSheet.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        return stream.ToArray();
    }
}
