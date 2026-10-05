# Joomla on Linux requires slash-separated ZIP entry names, even on Windows.
Add-Type -AssemblyName System.IO.Compression -ErrorAction Stop
Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
$bundleRoot = [System.IO.Path]::GetFullPath($env:ANTIDRONE_STAGE)
$bundleStream = [System.IO.File]::Open($env:ANTIDRONE_ZIP, [System.IO.FileMode]::CreateNew)
try {
    $bundleArchive = [System.IO.Compression.ZipArchive]::new($bundleStream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -LiteralPath $bundleRoot -File -Recurse -ErrorAction Stop | ForEach-Object {
            $bundleEntry = $_.FullName.Substring($bundleRoot.Length + 1).Replace([char]92, [char]47)
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($bundleArchive, $_.FullName, $bundleEntry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $bundleArchive.Dispose() }
} finally { $bundleStream.Dispose() }
