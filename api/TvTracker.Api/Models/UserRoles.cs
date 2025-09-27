using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("user_roles", Schema = "app")]
public class UserRoles
{
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("role_id")]
    public Guid RoleId { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonIgnore]
    public required Users User { get; set; }
    [JsonIgnore]
    public required Roles Role { get; set; }
}
