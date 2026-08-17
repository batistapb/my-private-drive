namespace MyPrivateDrive.Application.Files;

public class StorageSettings
{
    public string Root { get; set; } = "storage";
    public long MaxSizeBytes { get; set; } = 100 * 1024 * 1024;
}
