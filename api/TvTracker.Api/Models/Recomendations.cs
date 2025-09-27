using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("recommendations", Schema = "app")]
public class Recommendations
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("tv_show_id")]
    public Guid TvShowId { get; set; }

    [Required]
    [Column("score", TypeName = "numeric(5,4)")]
    public decimal Score { get; set; }

    [Column("reason")]
    public string? Reason { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonIgnore]
    public required Users User { get; set; }

    [JsonIgnore]
    public required TvShows TvShow { get; set; }
}
