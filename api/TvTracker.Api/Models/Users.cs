using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("users", Schema = "app")]
public class Users
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("email")]
    public required string Email { get; set; }

    [Required]
    [Column("email_verified")]
    public bool EmailVerified { get; set; }

    [Required]
    [Column("password_hash")]
    public required string PasswordHash { get; set; }

    [Column("display_name")]
    public string? DisplayName { get; set; }

    [Required]
    [Column("is_admin")]
    public bool IsAdmin { get; set; }

    [Required]
    [Column("consent_rgpd")]
    public bool ConsentRgpd { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Required]
    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTimeOffset? DeletedAt { get; set; }

    [JsonIgnore]
    public ICollection<UserRoles> UserRoles { get; set; } = new List<UserRoles>();
    [JsonIgnore]
    public ICollection<RefreshTokens> RefreshTokens { get; set; } = new List<RefreshTokens>();
    [JsonIgnore]
    public ICollection<Favorites> Favorites { get; set; } = new List<Favorites>();
    [JsonIgnore]
    public ICollection<Recommendations> Recommendations { get; set; } = new List<Recommendations>();
    [JsonIgnore]
    public ICollection<AuditLogs> AuditLogs { get; set; } = new List<AuditLogs>();
}
