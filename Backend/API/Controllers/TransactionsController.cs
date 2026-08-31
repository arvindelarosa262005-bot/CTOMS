using CTOMS.Application.Features.Transactions.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactions;

    public TransactionsController(ITransactionService transactions)
    {
        _transactions = transactions;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Usher")]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request, CancellationToken ct)
        => Ok(await _transactions.CreateAsync(request, ct));

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> GetAll([FromQuery] TransactionQuery query, CancellationToken ct)
        => Ok(await _transactions.QueryAsync(query, ct));

    [HttpGet("my")]
    public async Task<IActionResult> GetMy([FromQuery] TransactionQuery query, CancellationToken ct)
        => Ok(await _transactions.GetMyHistoryAsync(query, ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _transactions.GetByIdAsync(id, ct));

    [HttpPost("{id:guid}/void")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Void(Guid id, [FromBody] VoidBody body, CancellationToken ct)
        => Ok(await _transactions.VoidAsync(id, body.Reason, ct));

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetArchived(Guid id, [FromQuery] bool archived, CancellationToken ct)
        => Ok(await _transactions.SetArchivedAsync(id, archived, ct));
}

public record VoidBody(string Reason);
