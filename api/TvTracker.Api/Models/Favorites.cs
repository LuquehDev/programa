using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


[Table("favorites", Schema = "app")]
public class Favorites
{
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("tv_show_id")]
    public Guid TvShowId { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonIgnore]
    public Users? User { get; set; }

    [JsonIgnore]
    public TvShows? TvShow { get; set; }
}
