using Microsoft.EntityFrameworkCore;

namespace TvTracker.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public required DbSet<Actors> Actors { get; set; }
        public required DbSet<Episodes> Episodes { get; set; }
        public required DbSet<TvShowActors> TvShowActors { get; set; }
        public required DbSet<TvShows> TvShows { get; set; }
        public required DbSet<Users> Users { get; set; }
        public required DbSet<Roles> Roles { get; set; }
        public required DbSet<UserRoles> UserRoles { get; set; }
        public required DbSet<RefreshTokens> RefreshTokens { get; set; }
        public required DbSet<Genres> Genres { get; set; }
        public required DbSet<TvShowGenres> TvShowGenres { get; set; }
        public required DbSet<Favorites> Favorites { get; set; }
        public required DbSet<Recommendations> Recommendations { get; set; }
        public required DbSet<EmailQueue> EmailQueue { get; set; }
        public required DbSet<AuditLogs> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("app");

            // ========================== USERS ==========================
            modelBuilder.Entity<Users>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.Email).HasColumnName("email").IsRequired();
                e.HasIndex(x => x.Email).IsUnique();

                e.Property(x => x.EmailVerified).HasColumnName("email_verified").IsRequired();
                e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
                e.Property(x => x.DisplayName).HasColumnName("display_name");
                e.Property(x => x.IsAdmin).HasColumnName("is_admin").IsRequired();
                e.Property(x => x.ConsentRgpd).HasColumnName("consent_rgpd").IsRequired();

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.Property(x => x.UpdatedAt).HasColumnName("updated_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            });

            // ========================== ROLES ==========================
            modelBuilder.Entity<Roles>(e =>
            {
                e.ToTable("roles");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.Name).HasColumnName("name").IsRequired();
                e.HasIndex(x => x.Name).IsUnique();
            });

            // ======================= USER_ROLES ========================
            modelBuilder.Entity<UserRoles>(e =>
            {
                e.ToTable("user_roles");
                e.HasKey(x => new { x.UserId, x.RoleId });

                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.RoleId).HasColumnName("role_id");

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasOne(x => x.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(x => x.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ====================== REFRESH_TOKENS =====================
            modelBuilder.Entity<RefreshTokens>(e =>
            {
                e.ToTable("refresh_tokens");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.TokenHash).HasColumnName("token_hash").IsRequired();
                e.Property(x => x.ExpiresAt).HasColumnName("expires_at").IsRequired();
                e.Property(x => x.RevokedAt).HasColumnName("revoked_at");
                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasIndex(x => x.UserId).HasDatabaseName("ix_refresh_user");
                e.HasIndex(x => x.ExpiresAt).HasDatabaseName("ix_refresh_expires");

                e.HasOne(x => x.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================== TV_SHOWS ========================
            modelBuilder.Entity<TvShows>(e =>
            {
                e.ToTable("tv_shows");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.Title).HasColumnName("title").IsRequired();
                e.HasIndex(x => x.Title).HasDatabaseName("ix_tv_shows_title");

                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.Type).HasColumnName("type");
                e.Property(x => x.ReleaseYear).HasColumnName("release_year");

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.Property(x => x.UpdatedAt).HasColumnName("updated_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasIndex(x => x.Type).HasDatabaseName("ix_tv_shows_type");
            });

            // ========================== EPISODES ========================
            modelBuilder.Entity<Episodes>(e =>
            {
                e.ToTable("episodes");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.TvShowId).HasColumnName("tv_show_id");
                e.Property(x => x.SeasonNumber).HasColumnName("season_number").IsRequired();
                e.Property(x => x.EpisodeNumber).HasColumnName("episode_number").IsRequired();
                e.Property(x => x.Title).HasColumnName("title").IsRequired();
                e.Property(x => x.Synopsis).HasColumnName("synopsis");
                e.Property(x => x.ReleaseDate).HasColumnName("release_date");

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.Property(x => x.UpdatedAt).HasColumnName("updated_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasIndex(x => x.TvShowId).HasDatabaseName("ix_episodes_show");
                e.HasIndex(x => x.ReleaseDate).HasDatabaseName("ix_episodes_release");
                e.HasIndex(x => new { x.TvShowId, x.SeasonNumber, x.EpisodeNumber })
                    .IsUnique().HasDatabaseName("episodes_tvshow_season_episode_unique");

                e.HasOne(x => x.TvShow)
                    .WithMany(s => s.Episodes)
                    .HasForeignKey(x => x.TvShowId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =========================== ACTORS =========================
            modelBuilder.Entity<Actors>(e =>
            {
                e.ToTable("actors", "app"); // schema app

                e.HasKey(x => x.Id);

                e.Property(x => x.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()")
                    .ValueGeneratedOnAdd();

                e.Property(x => x.FullName)
                    .HasColumnName("full_name")
                    .IsRequired();

                e.HasIndex(x => x.FullName)
                    .HasDatabaseName("ix_actors_name");

                // Novas colunas
                e.Property(x => x.Nationality)
                    .HasColumnName("nationality");

                e.Property(x => x.BirthDate)
                    .HasColumnName("birth_date")
                    .HasColumnType("date")
                    .IsRequired(false);

                e.Property(x => x.Introduction)
                    .HasColumnName("introduction");

                e.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasDefaultValueSql("now()")
                    .ValueGeneratedOnAdd();

                e.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasDefaultValueSql("now()")
                    .ValueGeneratedOnAdd();
            });


            // ======================= TV_SHOW_ACTORS =====================
            modelBuilder.Entity<TvShowActors>(e =>
            {
                e.ToTable("tv_show_actors");
                e.HasKey(x => new { x.TvShowId, x.ActorId });

                e.Property(x => x.TvShowId).HasColumnName("tv_show_id");
                e.Property(x => x.ActorId).HasColumnName("actor_id");
                e.Property(x => x.Billing).HasColumnName("billing");

                e.HasIndex(x => x.ActorId).HasDatabaseName("ix_tsa_actor");
                e.HasIndex(x => new { x.TvShowId, x.Billing }).HasDatabaseName("ix_tsa_show_billing");

                e.HasOne(x => x.Actor)
                    .WithMany(a => a.TvShowActors)
                    .HasForeignKey(x => x.ActorId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.TvShow)
                    .WithMany(s => s.TvShowActors)
                    .HasForeignKey(x => x.TvShowId)
                    .OnDelete(DeleteBehavior.Cascade);

            });

            // =========================== GENRES =========================
            modelBuilder.Entity<Genres>(e =>
            {
                e.ToTable("genres");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.Name).HasColumnName("name").IsRequired();
                e.HasIndex(x => x.Name).IsUnique();
            });

            // ======================= TV_SHOW_GENRES =====================
            modelBuilder.Entity<TvShowGenres>(e =>
            {
                e.ToTable("tv_show_genres");
                e.HasKey(x => new { x.TvShowId, x.GenreId });

                e.Property(x => x.TvShowId).HasColumnName("tv_show_id");
                e.Property(x => x.GenreId).HasColumnName("genre_id");

                e.HasOne(x => x.TvShow)
                    .WithMany(s => s.TvShowGenres)
                    .HasForeignKey(x => x.TvShowId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Genre)
                    .WithMany(g => g.TvShowGenres)
                    .HasForeignKey(x => x.GenreId)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasIndex(x => x.GenreId).HasDatabaseName("ix_tsg_genre");
            });

            // ========================== FAVORITES =======================
            modelBuilder.Entity<Favorites>(e =>
            {
                e.ToTable("favorites");
                e.HasKey(x => new { x.UserId, x.TvShowId });

                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.TvShowId).HasColumnName("tv_show_id");

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasOne(x => x.User)
                    .WithMany(u => u.Favorites)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.TvShow)
                    .WithMany(s => s.Favorites)
                    .HasForeignKey(x => x.TvShowId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => x.UserId).HasDatabaseName("ix_fav_user");
                e.HasIndex(x => x.TvShowId).HasDatabaseName("ix_fav_show");
            });

            // ======================= RECOMMENDATIONS ====================
            modelBuilder.Entity<Recommendations>(e =>
            {
                e.ToTable("recommendations");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.TvShowId).HasColumnName("tv_show_id");

                e.Property(x => x.Score).HasColumnName("score")
                    .HasColumnType("numeric(5,4)").IsRequired();

                e.Property(x => x.Reason).HasColumnName("reason");
                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasOne(x => x.User)
                    .WithMany(u => u.Recommendations)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.TvShow)
                    .WithMany(s => s.Recommendations)
                    .HasForeignKey(x => x.TvShowId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => new { x.UserId, x.TvShowId })
                    .IsUnique().HasDatabaseName("recommendations_user_tvshow_unique");

                e.HasIndex(x => x.UserId).HasDatabaseName("ix_rec_user");
                e.HasIndex(x => new { x.UserId, x.Score }).HasDatabaseName("ix_rec_score");
            });

            // ========================= EMAIL_QUEUE ======================
            modelBuilder.Entity<EmailQueue>(e =>
            {
                e.ToTable("email_queue");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.ToEmail).HasColumnName("to_email").IsRequired();
                e.Property(x => x.Subject).HasColumnName("subject").IsRequired();
                e.Property(x => x.Body).HasColumnName("body").IsRequired();
                e.Property(x => x.Status).HasColumnName("status").IsRequired();
                e.Property(x => x.Attempts).HasColumnName("attempts").IsRequired();

                e.Property(x => x.ScheduledAt).HasColumnName("scheduled_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.Property(x => x.SentAt).HasColumnName("sent_at");
                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasIndex(x => new { x.Status, x.ScheduledAt }).HasDatabaseName("ix_email_status_sched");
            });

            // ========================= AUDIT_LOGS =======================
            modelBuilder.Entity<AuditLogs>(e =>
            {
                e.ToTable("audit_logs");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id")
                    .HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();

                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.Action).HasColumnName("action").IsRequired();
                e.Property(x => x.Entity).HasColumnName("entity");
                e.Property(x => x.EntityId).HasColumnName("entity_id");
                e.Property(x => x.Ip).HasColumnName("ip");

                e.Property(x => x.CreatedAt).HasColumnName("created_at")
                    .HasDefaultValueSql("now()").ValueGeneratedOnAdd();

                e.HasOne(x => x.User)
                    .WithMany(u => u.AuditLogs)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasIndex(x => x.UserId).HasDatabaseName("ix_audit_user");
                e.HasIndex(x => new { x.Action, x.CreatedAt }).HasDatabaseName("ix_audit_action_time");
            });
        }
    }
}
