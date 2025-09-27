using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("genres", Schema = "app")]
public class Genres
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("name")]
    public required string Name { get; set; }

    [JsonIgnore]
    public ICollection<TvShowGenres> TvShowGenres { get; set; } = new List<TvShowGenres>();
}
