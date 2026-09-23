# Docker App Setup

Docker Compose setup for the AmazeZone frontend (a React + TypeScript SPA built with
Vite).

The compose file defines three services:

- `frontend` - the production build: nginx serves the compiled app. This is the only
  service started by a plain `docker compose up`.
- `frontend_dev` - the Vite dev server with hot module reload. **Gated behind the
  `development` profile.**
- `test` - a one-shot Vitest run that exits. **Gated behind the `test` profile.**

This document focuses on Windows users, but there are helper scripts for VCL that can
also be used on Linux

## Prerequisites
- Internet access for the first image pulls

Windows Users:
- Windows 10/11 with PowerShell (the helper scripts target Windows)
- Docker Desktop with the WSL2 backend (install it with the script below if needed)

Mac/Linux Users:
- Install docker desktop or the docker cli, whichever you are more comfortable with

> NOTE: VCL Users
>
> VCL is Linux and there's documentation with how to get up and running with VCL and docker in the BuildTools/scripts/vcl directory

## Quick Start

1. **Install or start Docker Desktop** (no-op if already running):

   ```powershell
   .\BuildTools\scripts\install_docker.ps1
   ```

2. **Create `app/.env.dev`** (required for the dev and test services - the
   compose file declares it with `env_file … required: true`):
   - In the Explorer, open `app/example.env.dev`, then select all (Ctrl+A) and copy (Ctrl+C).
   - In the `app/` folder, right-click -> *New File…*, name it `.env.dev`, and paste (Ctrl+V).
   - You should not need to change the values: it sets `VITE_RUBY_API_URL`
     (the AmazeZoneAPI URL, default `http://localhost:3005`). Without this file,
     starting the dev or test services fails with `env file .../app/.env.dev not found` (a plain production `docker compose up` still works) - see
     [Troubleshooting](#troubleshooting)).
   - Do **not** add `VITE_PORT` to this file (see
     [Environment variables](#environment-variables)).

3. **Start the dev stack** (Vite dev server with HMR):

   ```powershell
   docker compose -f BuildTools\docker-compose.yml --profile development up -d frontend_dev
   ```

4. **Open the AmazeZone app** in your browser: `http://localhost:8888`

5. **Stop the stack** when done:

   ```powershell
   docker compose -f BuildTools\docker-compose.yml --profile development down
   ```

## Docker Installation Script

`scripts\install_docker.ps1` - installs or starts Docker Desktop on Windows (WSL2 backend).

- Docker already running -> prints a message and exits.
- Docker installed but stopped -> prompts to start Docker Desktop (default: yes) and waits up to 5 minutes for the daemon.
- Docker not installed -> must be run from an **elevated (Administrator)** prompt; enables the WSL feature if missing (reboot + re-run in that case), downloads the Docker Desktop installer to `%USERPROFILE%\Downloads`, and launches it.

```powershell
.\BuildTools\scripts\install_docker.ps1 [-DockerPath <path>] [-Help]
```

## Project Startup Script

`scripts\compose_project.ps1` - starts, stops, or recreates the Docker Compose project
(manages `BuildTools\docker-compose.yml` by default).

- `-Start` -> `docker compose up -d`, then prints service status. The image is built
  automatically if it is missing. (This starts the default service, `frontend` - the
  nginx/production build on port 8080.)
- `-Recreate` -> tears down the project and redeploys it
  (`down --remove-orphans`, then `up -d --force-recreate --build`). The image is
  rebuilt unless `-NoRebuild` is passed. Use this after changing `package.json` /
  `package-lock.json` or the dockerfiles.
- `-Stop` -> `docker compose down --remove-orphans`; unless `-RemoveVolumes` /
  `-RemoveImages` are passed, it prompts about cleaning up volumes and images
  (default: no). `-RemoveVolumes` removes the project's named `node_modules` volume
  (which holds the installed packages, so the next start reinstalls them);
  `-RemoveImages` removes the images, forcing a full rebuild the next start.
- `-ComposeFile <path>` -> manage a different compose file.
- `-Cleanup` -> reserved; no-op in the current implementation (cleanup is controlled by
  `-RemoveVolumes` / `-RemoveImages`).
- `-Help` -> usage.

```powershell
.\BuildTools\scripts\compose_project.ps1 -Start
.\BuildTools\scripts\compose_project.ps1 -Recreate
.\BuildTools\scripts\compose_project.ps1 -Stop
.\BuildTools\scripts\compose_project.ps1 -Stop -RemoveVolumes -RemoveImages
```

> NOTE: the profile-gated services (`frontend_dev`, `test`) are not started by
> `-Start`. Use the explicit `docker compose --profile …` commands from the Quick
> Start section (or add `--profile` to your own compose commands).

### Service overview

| Service | Container | Host port | Profile | Notes |
| --- | --- | --- | --- | --- |
| frontend | `amazezoneapi-vite` | 8080 | *(default - none)* | image `amazezoneapi_vite_frontend:local`; multi-stage build (`Dockerfile`): `vite build` -> nginx serves `app/dist`; SPA fallback in `nginx/default_site.conf`; started by a plain `docker compose up` |
| frontend_dev | `amazezoneapi-vite-dev` | 8888 | `development` | image `amazezoneapi_vite_frontend:local-dev`; Vite dev server (container port 3000); `app/` bind-mounted at `/app` |
| test | `amazezoneapi-vitest` | - | `test` | reuses the dev image; runs `npm run test:dev` (`vitest run --passWithNoTests`) and exits; `restart: no` |

### Service profiles - what starts when

| Command | Services started |
| --- | --- |
| `docker compose up -d` (or `compose_project.ps1 -Start`) | `frontend` only (the default service) |
| `docker compose --profile development up -d frontend_dev` | `frontend_dev` **only** - `frontend` is not started (verified with `up --dry-run`: only `amazezoneapi-vite-dev` is created) |
| `docker compose --profile development up -d` (no service named) | `frontend` **and** `frontend_dev` - `frontend` has no profile, so it always starts unless you target a service explicitly |
| `docker compose --profile test run --rm test` | `test` only |

So the intended split is: **production** = plain `up`; **development** = always
name `frontend_dev` explicitly, as the Quick Start does.

### Container behavior

- `dev.Dockerfile` runs `npm install` at build time (Node `24-alpine` by default -
  override with the `NODE_VERSION` build arg) and starts
  `npm run dev -- --host 0.0.0.0 --port "${VITE_PORT:-3000}"`. The shell form of `CMD`
  is deliberate: in exec form `${VITE_PORT}` would be passed to vite literally.
- `app/` is bind-mounted into the container, so source edits are picked up by Vite's
  hot module reload without a rebuild.
- File watching is forced into polling mode (`CHOKIDAR_USEPOLLING=true`,
  `VITE_FORCE_POLLING=true`, `CHOKIDAR_INTERVAL=500`) so it works through the Docker
  Desktop file share on Windows.
- The `node_modules` named volume persists the installed packages across rebuilds -
  and, if it goes stale, can shadow the image's `node_modules`. Remove it
  (`docker volume rm amazezoneapi_frontend_node_modules`) and rebuild if a package
  misbehaves.
- `app/.env.dev` is **required** for the `frontend_dev` and `test` services
  (`env_file … required: true`). It supplies `VITE_RUBY_API_URL` (the AmazeZoneAPI
  URL, default `http://localhost:3005`). A fresh clone has no `.env.dev` (it is
  gitignored) - copy `app/example.env.dev` to `app/.env.dev` before the first
  `up`, or Compose fails with `env file .../app/.env.dev not found`.
- `Dockerfile` (production) builds the app and serves it with nginx on port 80,
  published as 8080.

### Environment variables

| Variable | Default | Where it is set | Purpose |
| --- | --- | --- | --- |
| `VITE_PORT` | host `8888`, container `3000` | **HOST** environment (shell) or `BuildTools/.env` - read by Compose interpolation | Port the dev server is published on and listens on. Set it on the host side and **both** sides of the mapping move together (e.g. `VITE_PORT=9999` -> published `9999:9999`). **Do not set it in `app/.env.dev`** - see below |
| `VITE_RUBY_API_URL` | `http://localhost:3005` | `app/.env.dev` -> container env -> `AxiosClient.tsx` | Base URL of the AmazeZoneAPI backend |
| `NODE_VERSION` | `24-alpine` | `Dockerfile` / `dev.Dockerfile` build arg | Node image used to build/run |
| `VITE_FORCE_POLLING` / `CHOKIDAR_USEPOLLING` / `CHOKIDAR_INTERVAL` | `true` / `true` / `500` | compose `environment` | Reliable file watching on Docker Desktop |

**Why `VITE_PORT` must not live in `app/.env.dev`:** Compose variable
interpolation (the `${VITE_PORT}` in the `ports` mapping) only sees the **host**
environment and the `.env` file next to the compose file - it never reads a
service's `env_file` entries. A `VITE_PORT` set only in `app/.env.dev` would reach
the container (so Vite listens on it) but not the port mapping (so Docker keeps
publishing the default), leaving the dev server unreachable. Verified with
`docker compose config`: `VITE_PORT=4000` in the env file -> container env `4000`,
mapping still `8888:3000`. If you change the published port, also update the
backend's CORS origin (root README, [How it connects to AmazeZoneAPI](../README.md#how-it-connects-to-amazezoneapi)).

### Running tests

The Vitest suite runs in a one-shot container. Because the `test` service is behind
the `test` profile, a normal `docker compose up` (or `compose_project.ps1 -Start`)
starts **only** the `frontend` service - it never runs the tests. To run the suite,
enable the profile explicitly:

```powershell
docker compose -f BuildTools\docker-compose.yml --profile test run --rm test
```

`app/.env.dev` is **required** for the `test` service (same as `frontend_dev`) -
create it first (Quick Start step 2) or the run fails before any test starts.

For the full workflow (including running from an attached VS Code terminal, writing
new specs, and code coverage), see the root [`TESTING.md`](../TESTING.md).

### Working with the AmazeZoneAPI backend

This repo is a separate compose project from
[AmazeZoneAPI](https://github.com/efg/AmazeZoneAPI). For the full list of settings
that must match between the two projects (API URL, CORS origin, ports), see
[How it connects to AmazeZoneAPI](../README.md#how-it-connects-to-amazezoneapi) in the
root README.

## Troubleshooting

- **`env file .../app/.env.dev not found`** - `app/.env.dev` is required for the
  `frontend_dev` and `test` services (the compose file declares it with
  `env_file … required: true`). Copy `app/example.env.dev` to `app/.env.dev`
  (Quick Start step 2) and retry.
- **Dev server unreachable on 8888** - check `docker compose ps` / `logs
  frontend_dev`. If you set `VITE_PORT` only in `app/.env.dev`, the container
  listens on that port while the published port stays the default - remove it from
  `app/.env.dev` and set `VITE_PORT` in the host shell environment instead
  (see [Environment variables](#environment-variables)).
- **Package missing inside the container after adding it to `package.json`** -
  rebuild the image and remove the stale `node_modules` volume if necessary
  (see [Container behavior](#container-behavior)).