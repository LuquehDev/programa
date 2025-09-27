using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


[Table("episodes", Schema = "app")]
public class Episodes
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("tv_show_id")]
    public Guid TvShowId { get; set; }

    [Required]
    [Column("season_number")]
    public int SeasonNumber { get; set; }

    [Required]
    [Column("episode_number")]
    public int EpisodeNumber { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("synopsis")]
    public string? Synopsis { get; set; }

    [Column("release_date")]
    public DateOnly? ReleaseDate { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Required]
    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    [JsonIgnore]
    public TvShows TvShow { get; set; } = null!;
}
