using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("tv_shows", Schema = "app")]
public class TvShows
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("release_year")]
    public int? ReleaseYear { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<Episodes> Episodes { get; set; } = new List<Episodes>();
    [JsonIgnore]
    public ICollection<TvShowActors> TvShowActors { get; set; } = new List<TvShowActors>();
    [JsonIgnore]
    public ICollection<TvShowGenres> TvShowGenres { get; set; } = new List<TvShowGenres>();
    [JsonIgnore]
    public ICollection<Favorites> Favorites { get; set; } = new List<Favorites>();
    [JsonIgnore]
    public ICollection<Recommendations> Recommendations { get; set; } = new List<Recommendations>();
}
