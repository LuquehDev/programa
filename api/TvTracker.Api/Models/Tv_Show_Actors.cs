using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("tv_show_actors", Schema = "app")]
public class TvShowActors
{
    [Column("tv_show_id")]
    public Guid TvShowId { get; set; }

    [Column("actor_id")]
    public Guid ActorId { get; set; }

    [Column("billing")]
    public int? Billing { get; set; }

    [JsonIgnore]
    public required Actors Actor { get; set; }

    [JsonIgnore]
    public required TvShows TvShow { get; set; }
}
