<#
.SYNOPSIS
    Starts, stops, or recreates the Docker Compose project for this repository on Windows.

.DESCRIPTION
    This script manages the Docker Compose project defined by the repository's
    docker-compose.yml file:

      1. With -Start, it runs "docker compose up -d" to build (if needed) and
         start the services, then prints the service status.
      2. With -Stop, it runs "docker compose down --remove-orphans" to stop and
         remove the services. Unless -RemoveVolumes or -RemoveImages is passed,
         it prompts whether the associated docker volumes and images should also
         be cleaned up. Removing the images means the project will do a full
         rebuild the next time it is started.
      3. With -Recreate, it tears down the project ("docker compose down
         --remove-orphans") and redeploys it ("docker compose up -d
         --force-recreate"). The app image is rebuilt by default; pass -NoRebuild
         to reuse the existing image. The app code is bind-mounted into the
         container, so config/env changes are picked up on the redeploy.
      4. Exactly one of -Start, -Stop, or -Recreate must be provided; specifying
         more than one is an error.

.PARAMETER Stop
    Stop and remove the docker compose project. If -RemoveVolumes and -RemoveImages
    are not both specified, you will be prompted about cleaning up volumes and images.

.PARAMETER Recreate
    Tear down the docker compose project and redeploy it. The app image is rebuilt
    by default; pass -NoRebuild to reuse the existing image. The app code is
    bind-mounted into the container, so config/env changes are picked up on the
    redeploy.

.PARAMETER NoRebuild
    With -Recreate, do not rebuild the app image; reuse the existing image.

.PARAMETER Start
    Start the docker compose project (building images first if needed) and print
    the service status.

.PARAMETER Cleanup
    Reserved. In the current implementation, cleanup of volumes and images is
    controlled by the -RemoveVolumes and -RemoveImages switches.

.PARAMETER Help
    Show this help message and exit without doing anything.

.PARAMETER ComposeFile
    Path to the docker-compose file to manage.
    Default: <script directory>\..\docker-compose.yml (BuildTools\docker-compose.yml)

.PARAMETER RemoveVolumes
    Remove the named docker volumes defined by the compose file when stopping the project.

.PARAMETER RemoveImages
    Remove the docker images used by the compose project after stopping it.
    NOTE: removing the images forces a full rebuild the next time the project starts.

.EXAMPLE
    .\compose_project.ps1 -Start
    Starts the docker compose project (building images first if needed).

.EXAMPLE
    .\compose_project.ps1 -Stop
    Stops and removes the compose project, prompting about cleaning up volumes and images.

.EXAMPLE
    .\compose_project.ps1 -Stop -RemoveVolumes -RemoveImages
    Stops the project and removes its volumes and images without prompting.

.EXAMPLE
    .\compose_project.ps1 -Recreate
    Tears down and redeploys the project, rebuilding the app image (default).

.EXAMPLE
    .\compose_project.ps1 -Recreate -NoRebuild
    Tears down and redeploys the project, reusing the existing app image.

.EXAMPLE
    .\compose_project.ps1 -Start -ComposeFile "C:\path\to\docker-compose.yml"
    Starts a project defined by a custom compose file.

.EXAMPLE
    .\compose_project.ps1 -Help
    Displays usage information.

.NOTES
    Requirements: Docker (Docker Desktop) installed and running.
    See also: Get-Help .\compose_project.ps1
#>

param (
    [switch]$Stop,
    [switch]$Start,
    [switch]$Recreate,
    [switch]$Cleanup,
    [switch]$Help,
    [string]$ComposeFile = "$PSScriptRoot\..\docker-compose.yml",
    [switch]$RemoveVolumes,
    [switch]$RemoveImages,
    [switch]$NoRebuild
)

# ---------------------------------------------------------------
# Help / usage section
# ---------------------------------------------------------------
function ShowHelp {
    Write-Host ""
    Write-Host "compose_project.ps1 - Start, stop, or recreate the Docker Compose project on Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "    .\compose_project.ps1 (-Start | -Stop | -Recreate) [-NoRebuild] [-Cleanup] [-ComposeFile <path>] [-RemoveVolumes] [-RemoveImages] [-Help]"
    Write-Host ""
    Write-Host "What it does:"
    Write-Host "    * -Start -> runs 'docker compose up -d' (building images if needed) and prints the status."
    Write-Host "    * -Stop  -> runs 'docker compose down --remove-orphans' and, unless -RemoveVolumes /"
    Write-Host "      -RemoveImages are passed, prompts about cleaning up volumes and images."
    Write-Host "    * -Recreate -> tears down the project and redeploys it (rebuilds the app image"
    Write-Host "      unless -NoRebuild is passed); the app code is bind-mounted, so config/env"
    Write-Host "      changes are picked up on the redeploy."
    Write-Host "    * Exactly one of -Start, -Stop, or -Recreate is required."
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "    -Start"
    Write-Host "        Start the docker compose project and print the service status."
    Write-Host ""
    Write-Host "    -Stop"
    Write-Host "        Stop and remove the docker compose project."
    Write-Host ""
    Write-Host "    -Recreate"
    Write-Host "        Tear down the project and redeploy it. The app image is rebuilt"
    Write-Host "        unless -NoRebuild is passed."
    Write-Host ""
    Write-Host "    -NoRebuild"
    Write-Host "        With -Recreate, do not rebuild the app image; reuse the existing image."
    Write-Host ""
    Write-Host "    -Cleanup"
    Write-Host "        Reserved; cleanup is currently handled by -RemoveVolumes / -RemoveImages."
    Write-Host ""
    Write-Host "    -ComposeFile <path>"
    Write-Host "        Path to the docker-compose file to manage."
    Write-Host "        Default: $ComposeFile"
    Write-Host ""
    Write-Host "    -RemoveVolumes"
    Write-Host "        Remove the named docker volumes defined by the compose file when stopping."
    Write-Host ""
    Write-Host "    -RemoveImages"
    Write-Host "        Remove the docker images used by the project after stopping."
    Write-Host "        NOTE: removing images forces a full rebuild next time the project starts."
    Write-Host ""
    Write-Host "    -Help"
    Write-Host "        Show this help message and exit."
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "    .\compose_project.ps1 -Start"
    Write-Host "    .\compose_project.ps1 -Stop"
    Write-Host "    .\compose_project.ps1 -Stop -RemoveVolumes -RemoveImages"
    Write-Host "    .\compose_project.ps1 -Recreate"
    Write-Host "    .\compose_project.ps1 -Recreate -NoRebuild"
    Write-Host "    .\compose_project.ps1 -Start -ComposeFile 'C:\path\to\docker-compose.yml'"
    Write-Host "    .\compose_project.ps1 -Help"
    Write-Host ""
}

if ($Help) {
    ShowHelp
    exit 0
}

$modeCount = [int][bool]$Stop + [int][bool]$Start + [int][bool]$Recreate

if ($modeCount -gt 1) {
    ShowHelp
    Write-Host "Cannot specify more than one of -Start, -Stop, or -Recreate. Please choose one." -ForegroundColor Red
    exit 1
}

if ($modeCount -lt 1) {
    ShowHelp
    Write-Host "You must specify one of -Start, -Stop, or -Recreate. Please choose one." -ForegroundColor Red
    exit 1
}

if ($Start) {
    Write-Host "Starting the docker compose project..." -ForegroundColor Cyan
    docker compose -f $ComposeFile up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to start the docker compose project. Please check the compose file and try again." -ForegroundColor Red
        exit 1
    }
    docker compose -f $ComposeFile ps
    Write-Host "Docker compose project started." -ForegroundColor Green
    exit
}

if ($Recreate) {
    Write-Host "Tearing down the docker compose project..." -ForegroundColor Cyan
    docker compose -f $ComposeFile down --remove-orphans
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to tear down the docker compose project. Please check the compose file and try again." -ForegroundColor Red
        exit 1
    }

    $UpArgs = @(
        'docker', 'compose',
        '-f', $ComposeFile,
        'up',
        '-d',
        '--force-recreate'
    )
    if (-not $NoRebuild) {
        $UpArgs += '--build'
    }

    Write-Host "Redeploying the docker compose project..." -ForegroundColor Cyan
    $UpString = $UpArgs -join ' '
    Write-Host "Executing command: $UpString" -ForegroundColor Yellow
    & Invoke-Expression $UpString
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to redeploy the docker compose project. Please check the compose file and try again." -ForegroundColor Red
        exit 1
    }

    docker compose -f $ComposeFile ps
    Write-Host "Docker compose project recreated." -ForegroundColor Green
    exit
}

# Any remaining code here is for the -Stop operation

if ( -not ($RemoveVolumes -or $RemoveImages) ) {
    Write-Host "NOTE: If you choose not to cleanup volumes, you will have to cleanup them manually later to avoid disk space issues." -ForegroundColor Yellow
    $volumes_prompt = Read-Host -Prompt "Do you want to cleanup any associated docker volumes? (y|n) (default: n)"
    $RemoveVolumes = ($volumes_prompt.Trim().ToLower() -eq 'y')

    Write-Host "NOTE: If you choose not to cleanup images, you will have to cleanup them manually later to avoid disk space issues." -ForegroundColor Yellow
    Write-Host "      Do not clean them up if you're not finished with the project yet as that will cause a full rebuild." -ForegroundColor Yellow
    $images_prompt = Read-Host -Prompt "Do you want to cleanup associated docker images? (y|n) (default: n)"
    $RemoveImages = ($images_prompt.Trim().ToLower() -eq 'y')
}

if ($RemoveImages) {
    $image_ids = docker compose -f "$ComposeFile" images -q
}

if ( docker compose -f "$ComposeFile" ps -q ) {
    $CMD = @(
        'docker', 'compose',
        '-f', "$ComposeFile",
        'down',
        '--remove-orphans'
    )
    if ($RemoveVolumes) {
        $CMD += '--volumes'
    }
    Write-Host "Stopping and removing the docker compose project..." -ForegroundColor Cyan
    $CMDString = $CMD -join ' '
    Write-Host "Executing command: $CMDString" -ForegroundColor Yellow
    & Invoke-Expression $CMDString
    Write-Host "Docker compose project stopped and removed." -ForegroundColor Green
}

if ($RemoveImages) {
    Write-Host "Cleaning up docker images..." -ForegroundColor Cyan
    $image_ids | ForEach-Object {
        Write-Host "Removing image: $_" -ForegroundColor Yellow
        docker rmi -f $_
    }
    Write-Host "Docker images cleaned up." -ForegroundColor Green
}
