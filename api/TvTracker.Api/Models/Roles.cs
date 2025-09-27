using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("roles", Schema = "app")]
public class Roles
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("name")]
    public required string Name { get; set; }

    [JsonIgnore]
    public ICollection<UserRoles> UserRoles { get; set; } = new List<UserRoles>();
}
