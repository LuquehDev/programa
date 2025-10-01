using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

[Table("actors", Schema = "app")]
public class Actors
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("full_name")]
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Column("nationality")]
    public string? Nationality { get; set; }

    [Column("birth_date", TypeName = "date")]
    public DateTime? BirthDate { get; set; }

    [NotMapped] 
    public int? Age
    {
        get
        {
            if (BirthDate == null) return null;
            var today = DateTime.Today;
            var age = today.Year - BirthDate.Value.Year;
            if (BirthDate.Value.Date > today.AddYears(-age)) age--;
            return age;
        }
    }

    [Column("introduction")]
    public string? Introduction { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<TvShowActors> TvShowActors { get; set; } = new List<TvShowActors>();
}
