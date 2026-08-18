using Microsoft.EntityFrameworkCore;
using MyPrivateDrive.Domain.Entities;

namespace MyPrivateDrive.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<FileItem> Files => Set<FileItem>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Soft-delete (trash): every normal query excludes trashed rows automatically.
        // Trash-specific queries opt back in with .IgnoreQueryFilters().
        modelBuilder.Entity<Folder>().HasQueryFilter(f => f.DeletedAt == null);
        modelBuilder.Entity<FileItem>().HasQueryFilter(f => f.DeletedAt == null);
    }
}
