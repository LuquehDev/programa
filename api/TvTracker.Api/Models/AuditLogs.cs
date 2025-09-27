using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net;
using System.Text.Json.Serialization;

[Table("audit_logs", Schema = "app")]
public class AuditLogs
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Required]
    [Column("action")]
    public required string Action { get; set; }

    [Column("entity")]
    public string? Entity { get; set; }

    [Column("entity_id")]
    public Guid? EntityId { get; set; }

    [Column("ip")]
    public IPAddress? Ip { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonIgnore]
    public Users? User { get; set; }
}
