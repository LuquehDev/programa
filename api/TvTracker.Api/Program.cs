using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TvTracker.Data;

var builder = WebApplication.CreateBuilder(args);

// ============== CORS ==============
var corsPolicy = "Aplication";
builder.Services.AddCors(opt =>
{
    opt.AddPolicy(corsPolicy, p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    );
});

// ============== DB ==============
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
);

// ============== Identity util (Hasher) ==============
builder.Services.AddScoped<IPasswordHasher<Users>, PasswordHasher<Users>>();

// ============== JWT Auth ==============
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
var jwtIssuer = jwtSection["Issuer"] ?? "MyApi";
var jwtAudience = jwtSection["Audience"] ?? "MyFrontend";
var jwtMinutes = int.TryParse(jwtSection["Minutes"], out var m) ? m : 15;

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddJwtBearer("Bearer", o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ============== Swagger ==============
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(corsPolicy);

// Auth middlewares
app.UseAuthentication();
app.UseAuthorization();


// ========================== AUTH =============================

// ========== Email ==========
app.MapGet("/auth/me", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
    if (sub is null) return Results.Unauthorized();

    if (!Guid.TryParse(sub, out var userId)) return Results.Unauthorized();
    var u = await db.Users.FindAsync(userId);
    if (u is null) return Results.Unauthorized();

    return Results.Ok(new
    {
        id = u.Id,
        email = u.Email,
        displayName = u.DisplayName,
        isAdmin = u.IsAdmin,
        emailVerified = u.EmailVerified
    });
}).RequireAuthorization();

// ========== Register ==========
app.MapPost("/auth/register", async (
    [FromBody] RegisterDto dto,
    [FromServices] AppDbContext db,
    [FromServices] IPasswordHasher<Users> hasher) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return Results.BadRequest(new { error = "Email e password são obrigatórios." });

        if (!dto.ConsentRgpd)
            return Results.BadRequest(new { error = "É necessário consentir o RGPD." });

        var emailNorm = dto.Email.Trim().ToLowerInvariant();
        var exists = await db.Users.AnyAsync(u => u.Email.ToLower() == emailNorm);
        if (exists)
            return Results.Conflict(new { error = "Email já registado." });

        var now = DateTimeOffset.UtcNow;

        var user = new Users
        {
            Id = Guid.NewGuid(),
            Email = emailNorm,
            EmailVerified = false,
            PasswordHash = "",
            DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? null : dto.DisplayName.Trim(),
            IsAdmin = false,
            ConsentRgpd = dto.ConsentRgpd,
            CreatedAt = now,
            UpdatedAt = now,
            DeletedAt = null
        };

        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Results.Created($"/users/{user.Id}", new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.EmailVerified,
            user.IsAdmin,
            user.ConsentRgpd,
            user.CreatedAt,
            user.UpdatedAt
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.Message,
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Erro ao criar utilizador"
        );
    }
});

// ========== Login ==========
app.MapPost("/auth/login", async (
    [FromBody] LoginDto dto,
    [FromServices] AppDbContext db,
    [FromServices] IPasswordHasher<Users> hasher) =>
{
    var emailNorm = (dto.Email ?? "").Trim().ToLowerInvariant();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNorm);
    if (user is null)
        return Results.Unauthorized();

    var verify = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password ?? "");
    if (verify == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(ClaimTypes.Name, user.DisplayName ?? user.Email),
        new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User"),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
    var now = DateTime.UtcNow;
    var expires = now.AddMinutes(jwtMinutes);

    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        notBefore: now,
        expires: expires,
        signingCredentials: creds
    );

    var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new
    {
        accessToken,
        expiresAtUtc = expires,
        user = new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            isAdmin = user.IsAdmin
        }
    });
});


// ========================== ROTAS SIMPLES ========================

app.MapGet("/actors", async ([FromServices] AppDbContext db) =>
    await db.Actors
    .Select(x => new { x.Id, x.FullName, x.Age, x.Nationality, x.Introduction })
    .ToListAsync());

// ===================== ACTOR: DETALHES + TV SHOWS =====================
app.MapGet("/actor/{id:guid}/details", async (
    Guid id,
    [FromServices] AppDbContext db,
    CancellationToken ct) =>
{
    var actor = await db.Actors
        .AsNoTracking()
        .Where(a => a.Id == id)
        .Select(a => new
        {
            // Detalhes do actor
            a.Id,
            FullName = a.FullName,
            a.Nationality,
            a.BirthDate,
            a.Introduction,
            a.CreatedAt,
            a.UpdatedAt,

            // TV Shows onde participou, ordenados por billing
            TvShows = a.TvShowActors
                .OrderBy(t => t.Billing)
                .Select(t => new
                {
                    t.TvShowId,
                    t.Billing,
                    Title = t.TvShow.Title,
                    t.TvShow.Description,
                    t.TvShow.Type,
                    t.TvShow.ReleaseYear,
                    Genres = t.TvShow.TvShowGenres
                        .Select(g => new { g.Genre.Id, g.Genre.Name })
                        .ToList()
                })
                .ToList()
        })
        .SingleOrDefaultAsync(ct);

    return actor is null
        ? Results.NotFound(new { error = "Actor não encontrado." })
        : Results.Ok(actor);
});

app.MapGet("/roles", async ([FromServices] AppDbContext db) =>
    await db.Roles.ToListAsync());

app.MapGet("/users", async ([FromServices] AppDbContext db) =>
    await db.Users.ToListAsync());

// ========================== TV SHOWS ========================

app.MapGet("/tv-shows", async ([FromServices] AppDbContext db) =>
    await db.TvShows
        .Include(x => x.TvShowGenres)
        .ThenInclude(tg => tg.Genre)
        .Select(x => new
        {
            x.Id,
            x.Title,
            x.Description,
            x.Type,
            x.ReleaseYear,
            genres = x.TvShowGenres.Select(tg => new { tg.Genre.Id, tg.Genre.Name }).ToList()
        })
        .ToListAsync());

app.MapGet("/tv-show/{id:guid}/genres", async (Guid id, [FromServices] AppDbContext db) =>
    await db.TvShowGenres
        .Where(x => x.TvShowId == id)
        .Include(x => x.Genre)
        .Select(x => new { x.Genre.Id, x.Genre.Name })
        .ToListAsync());

app.MapGet("/tv-show/{id:guid}/episodes", async (Guid id, [FromServices] AppDbContext db) =>
        await db.Episodes
        .Where(x => x.TvShowId == id)
        .OrderBy(x => x.ReleaseDate)
        .Select(x => new { TvShowId = x.TvShow.Id, x.EpisodeNumber, x.SeasonNumber, x.Title, x.Synopsis, x.ReleaseDate })
        .ToListAsync());

app.MapGet("/tv-show/{id:guid}/casts", async (Guid id, [FromServices] AppDbContext db) =>
    await db.TvShowActors
        .AsSplitQuery()
        .Where(x => x.TvShowId == id)
        .Include(x => x.Actor)
        .OrderBy(x => x.Billing)
        .Select(x => new { x.Actor.Id, x.Actor.FullName, x.Billing })
        .ToListAsync());

// ===================== TV SHOW: DETALHES + CAST =====================
app.MapGet("/tv-show/{id:guid}/details", async (
    Guid id,
    [FromServices] AppDbContext db,
    CancellationToken ct) =>
{
    var show = await db.TvShows
        .AsNoTracking()
        .Where(s => s.Id == id)
        .Select(s => new
        {
            s.Id,
            s.Title,
            s.Description,
            s.Type,
            s.ReleaseYear,
            s.CreatedAt,
            s.UpdatedAt,

            Genres = s.TvShowGenres
                .Select(tg => new { tg.Genre.Id, tg.Genre.Name })
                .ToList(),

            Cast = s.TvShowActors
                .OrderBy(t => t.Billing)
                .Select(t => new
                {
                    t.ActorId,
                    t.Billing,
                    t.Actor.FullName,
                    t.Actor.Nationality,
                    t.Actor.BirthDate,
                    t.Actor.Introduction
                })
                .ToList()
        })
        .SingleOrDefaultAsync(ct);

    return show is null
        ? Results.NotFound(new { error = "TV Show não encontrado." })
        : Results.Ok(show);
});

// ===================== FAVORITES =====================

app.MapPost("/users/{userId}/favorites/{tvShowId}", async (
    string userId,
    string tvShowId,
    AppDbContext db,
    CancellationToken ct) =>
{
    if (!Guid.TryParse(userId, out var userGuid))
        return Results.BadRequest(new { error = "userId inválido (GUID esperado)." });

    if (!Guid.TryParse(tvShowId, out var showGuid))
        return Results.BadRequest(new { error = "tvShowId inválido (GUID esperado)." });

    // existe o show?
    var existsShow = await db.TvShows.AsNoTracking().AnyAsync(s => s.Id == showGuid, ct);
    if (!existsShow)
        return Results.NotFound(new { error = "TV Show não encontrado." });

    // já é favorito?
    var existsFav = await db.Favorites.AnyAsync(f => f.UserId == userGuid && f.TvShowId == showGuid, ct);
    if (existsFav) return Results.NoContent();

    db.Favorites.Add(new Favorites
    {
        UserId = userGuid,
        TvShowId = showGuid,
        CreatedAt = DateTimeOffset.UtcNow
    });
    await db.SaveChangesAsync(ct);

    return Results.Created($"/users/{userGuid}/favorites/{showGuid}", new { tvShowId = showGuid });
});

// IDs dos favoritos de um user (simples)
app.MapGet("/users/{userId}/favorites-ids", async (
    string userId,
    AppDbContext db,
    CancellationToken ct) =>
{
    if (!Guid.TryParse(userId, out var uid))
        return Results.BadRequest(new { error = "userId inválido (GUID esperado)." });

    var ids = await db.Favorites
        .AsNoTracking()
        .Where(f => f.UserId == uid)
        .Select(f => f.TvShowId)
        .ToListAsync(ct);

    return Results.Ok(ids);
});

// DELETE /users/{userId}/favorites/{tvShowId}
app.MapDelete("/users/{userId}/favorites/{tvShowId}", async (
    string userId,
    string tvShowId,
    AppDbContext db,
    CancellationToken ct) =>
{
    if (!Guid.TryParse(userId, out var userGuid))
        return Results.BadRequest(new { error = "userId inválido (GUID esperado)." });

    if (!Guid.TryParse(tvShowId, out var showGuid))
        return Results.BadRequest(new { error = "tvShowId inválido (GUID esperado)." });

    var fav = await db.Favorites
        .FirstOrDefaultAsync(f => f.UserId == userGuid && f.TvShowId == showGuid, ct);

    if (fav is null) return Results.NoContent(); // idempotente

    db.Favorites.Remove(fav);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
});


app.Run();

// ========================== DTOS ========================
public record RegisterDto(string Email, string Password, string? DisplayName, bool ConsentRgpd);
public record LoginDto(string Email, string Password);