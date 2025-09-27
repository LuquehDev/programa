using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("email_queue", Schema = "app")]
public class EmailQueue
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("to_email")]
    public required string ToEmail { get; set; } 

    [Required]
    [Column("subject")]
    public required string Subject { get; set; } 

    [Required]
    [Column("body")]
    public required string Body { get; set; } 

    [Required]
    [Column("status")]
    public short Status { get; set; }

    [Required]
    [Column("attempts")]
    public int Attempts { get; set; }

    [Required]
    [Column("scheduled_at")]
    public DateTimeOffset ScheduledAt { get; set; }

    [Column("sent_at")]
    public DateTimeOffset? SentAt { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}