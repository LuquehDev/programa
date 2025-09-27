using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("tv_show_genres", Schema = "app")]
public class TvShowGenres
{
    [Column("tv_show_id")]
    public Guid TvShowId { get; set; }

    [Column("genre_id")]
    public Guid GenreId { get; set; }

    [JsonIgnore]
    public required TvShows TvShow { get; set; }
    [JsonIgnore]
    public required Genres Genre { get; set; }
}
