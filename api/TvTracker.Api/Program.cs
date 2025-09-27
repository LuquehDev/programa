using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using TvTracker.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/actors", async ([FromServices] AppDbContext db) =>
    await db.Actors
    .Select(x => new{ x.Id, x.FullName})
    .ToListAsync());

app.MapGet("/roles", async ([FromServices] AppDbContext db) =>
    await db.Roles.ToListAsync());

app.MapGet("/users", async ([FromServices] AppDbContext db) =>
await db.Users.ToListAsync());

app.MapGet("/users/{id:guid}/role", async (Guid id, [FromServices] AppDbContext db) =>
    await db.UserRoles
    .AsSplitQuery()
    .Where(x => x.UserId == id)
    .Select(x => new {x.Role})
    .ToListAsync());

// ========================== TV SHOWS ========================

app.MapGet("/tv-shows", async ([FromServices] AppDbContext db) =>
    await db.TvShows
    .Include(x => x.Episodes)
    .Select(x => new {x.Id, x.Title, x.Description, x.Type, x.Episodes})
    .ToListAsync());

app.MapGet("/tv-show/{id:guid}/genres", async (Guid id, [FromServices] AppDbContext db) =>
    await db.TvShowGenres
        .Where(x => x.TvShowId == id)
        .Include(x => x.Genre)
        .Select(x => new { x.Genre.Id, x.Genre.Name })
        .ToListAsync());

app.MapGet("/tv-show/{id:guid}/episodes", async (Guid id, [FromServices] AppDbContext db) =>
        await db.Episodes
        .AsSplitQuery()
        .Where(x => x.TvShowId == id)
        .OrderBy(x => x.ReleaseDate)
        .Select(x => new { TvShowId = x.TvShow.Id, x.EpisodeNumber, x.SeasonNumber, x.Title, x.Synopsis, x.ReleaseDate})
        .ToListAsync());

app.MapGet("/tv-show/{id:guid}/casts", async (Guid id, [FromServices] AppDbContext db) =>
    await db.TvShowActors
        .AsSplitQuery()
        .Where(x => x.TvShowId == id)
        .Include(x => x.Actor)
        .OrderBy(x => x.Billing)
        .Select(x => new { x.Actor.Id, x.Actor.FullName, x.Billing })
        .ToListAsync());

app.Run();