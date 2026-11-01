$folder = 'C:\INSA\AgroGebeya'
$filter = '*.*'

$watcher = New-Object IO.FileSystemWatcher $folder, $filter -Property @{
    IncludeSubdirectories = $true
    EnableRaisingEvents   = $true
}

$global:filesChanged = $false

$action = {
    $path = $Event.SourceEventArgs.FullPath
    # Ignore .git folder changes to prevent infinite loops when committing
    if ($path -notmatch '\\\.git\\') {
        Write-Output "FILE_CHANGED: $path"
        $global:filesChanged = $true
    }
}

Register-ObjectEvent $watcher 'Changed' -Action $action > $null
Register-ObjectEvent $watcher 'Created' -Action $action > $null
Register-ObjectEvent $watcher 'Deleted' -Action $action > $null
Register-ObjectEvent $watcher 'Renamed' -Action $action > $null

Write-Output "Git watcher daemon started. Autonomously committing in the muluwengel mezemran ken..."

while ($true) {
    Start-Sleep -Seconds 2
    if ($global:filesChanged) {
        $global:filesChanged = $false
        Write-Output "Changes detected. Automatically committing..."
        
        # Change to the target directory to ensure git commands run in the correct context
        Push-Location $folder
        
        # Unstage everything first to ensure clean individual commits
        git reset > $null 2>&1
        
        # Get all changed files (tracked and untracked)
        $statusLines = git status --porcelain | Where-Object { $_.Trim() -ne '' }
        
        foreach ($line in $statusLines) {
            $statusCode = $line.Substring(0, 2)
            $fileStr = $line.Substring(3).Trim()
            
            if ($fileStr -match ' -> ') {
                $oldFile = ($fileStr -split ' -> ')[0].Trim('"')
                $newFile = ($fileStr -split ' -> ')[1].Trim('"')
                git add --all $oldFile
                git add --all $newFile
                $file = $newFile
            } else {
                $file = $fileStr.Trim('"')
                git add --all $file
            }
            
            # Only proceed if there is actually something staged
            $staged = git diff --cached --name-only
            if ($staged) {
                $type = "chore"
                if ($file -match "test") { $type = "test" }
                elseif ($file -match "\.(js|ts|py|cs|html|jsx|tsx)$") { $type = "feat" }
                elseif ($file -match "\.(css|scss|less)$") { $type = "style" }
                elseif ($file -match "README|docs") { $type = "docs" }
                
                $action = "upd"
                if ($statusCode -match 'A|\?\?') { $action = "add" }
                elseif ($statusCode -match 'D') { $action = "del" }
                elseif ($statusCode -match 'R') { $action = "ren" }
                
                $basename = Split-Path $file -Leaf
                $msg = "${type}: $action $basename"
                
                # Commit autonomously
                git commit -m "$msg"
            }
        }
        
        Pop-Location
    }
}
