# AMAZEZONE-FRONTEND

This guide provides instructions to setup the AmazeZone frontend using Docker.

The AmazeZone frontend is a single-page **React + TypeScript** application built with
**Vite**. It is a pure client-side app: it makes HTTP calls to the **AmazeZoneAPI**
backend (a Ruby on Rails API) for signup, login, and the authenticated `/home` and
`/products` pages.

## Prerequisites

1. VSCode
2. Git
3. Docker
    - Windows users install Docker Desktop
4. Clone this repo
5. (For a fully working app) the [AmazeZoneAPI](https://github.com/efg/AmazeZoneAPI) backend
    running and reachable at `http://localhost:3005` - see
    [How it connects to AmazeZoneAPI](#how-it-connects-to-amazezoneapi)

## Getting up and running

### Open VSCode and clone this repo

- CTRL + SHIFT + P will open the VSCode command palette
- Type Git: Clone in the palette window
- Press enter to select it and then paste the git url for the repo
- You will be asked to save the repo to a local directory
- After selecting the repository destination, you can have it open in the current window or a new window of VSCode

### Ensure that Docker is running

> NOTE:
>
> Windows users can run the `BuildTools/scripts/install_docker.ps1` script which will ensure that it's installed and is running. Full script details: [BuildTools/README.md](BuildTools/README.md)

### Configure the environment

Open this project in VSCode

Copy `app/example.env.dev` to `app/.env.dev` (step-by-step instructions: [BuildTools/README.md](BuildTools/README.md))

```text
VITE_RUBY_API_URL=http://localhost:3005
```

This file is **required** for the `frontend_dev` and `test` services - the compose
file declares it with `env_file … required: true`, so without it starting the dev or
test services fails with `env file .../app/.env.dev not found` (a plain production
`docker compose up` still works). It sets `VITE_RUBY_API_URL`
(the AmazeZoneAPI base URL). Vite only exposes variables prefixed with `VITE_` to the
browser bundle; the value is read in `app/src/utils/AxiosClient.tsx` (which defaults
to `http://localhost:3005` if the variable is missing).

Do **not** add `VITE_PORT` to this file - the dev server's ports come from the host
environment; a `VITE_PORT` set only here would change the container port but not the
published port, making the dev server unreachable (details:
[BuildTools/README.md - Environment variables](BuildTools/README.md#environment-variables)).

### Launch the docker compose stack

Open your terminal in VSCode, CTRL + SHIFT + `

> NOTE: Windows powershell users can use the `BuildTools/scripts/compose_project.ps1` script (full options: [BuildTools/README.md](BuildTools/README.md))

There are two ways to run the frontend:

```pwsh
# Production-style build (default service): nginx serves the built app on http://localhost:8080
docker compose -f BuildTools/docker-compose.yml up -d
# or: .\BuildTools\scripts\compose_project.ps1 -Start

# Development (Vite dev server with hot module reload) on http://localhost:8888
docker compose -f BuildTools/docker-compose.yml --profile development up -d frontend_dev
```

The development server runs on port 8888 by default (container port 3000). You can
access it on [http://localhost:8888](http://localhost:8888). To use a different
host port, set `VITE_PORT` in your **host** shell environment (e.g.
`$env:VITE_PORT = "9999"` in PowerShell before `docker compose up`) - both sides of
the mapping move together. Do not set it in `app/.env.dev` (see
[BuildTools/README.md - Environment variables](BuildTools/README.md#environment-variables)).

> NOTE:
>
> The `frontend_dev` service bind-mounts `app/` into the container, so source edits
> are picked up by Vite's hot module reload without a rebuild. File watching is
> forced into polling mode (`CHOKIDAR_USEPOLLING`, `VITE_FORCE_POLLING`) so it works
> through the Docker Desktop file share on Windows.
>
> Dependencies are installed into the image and persisted in the `node_modules`
> named volume, so after changing `package.json` you must rebuild the dev image -
> see [Adding npm dependencies](#adding-npm-dependencies).

In case of any issues, don't hesitate to open an issue on the [GitHub repository](https://github.com/efg/AmazeZone-Frontend) for assistance, or post on Moodle.

### Developing in VSCode (attach to the running container)

You do **not** need Node or npm on your host machine - everything lives in the
dev container. To get a terminal with Node, npm, Vite, and Vitest:

1. Install the **Microsoft Dev Containers** extension in VSCode (opening this
   repo will prompt you to install the recommended extensions from
   [.vscode/extensions.json](.vscode/extensions.json), which includes it)
2. Make sure the **dev** stack is running (the `frontend_dev` service - a plain
   `compose_project.ps1 -Start` only starts the production `frontend` service, so
   use `docker compose -f BuildTools/docker-compose.yml --profile development up -d frontend_dev`)
3. Command Palette (CTRL + SHIFT + P) -> **Dev Containers: Attach to Running Container…** -> select the **`amazezoneapi-vite-dev`** container
4. Open the integrated terminal - it now runs **inside** the container (cwd `/app`).
   Use it for `npm run dev`, `npm run lint`, `npm run test:dev`,
   `npx vitest run ...`, etc.

Notes:

- `app/` is bind-mounted at `/app`, so file edits you make in VSCode are live inside the container and picked up by Vite's hot module reload.
- If you stop the stack or rebuild the dev image, the attach dies with the container - start the stack again and re-attach.
- Day-to-day test workflow (watch mode, one-shot, coverage) is in [TESTING.md](TESTING.md).

## How it connects to AmazeZoneAPI

The frontend and the backend are **separate Docker compose projects** that talk over
the Docker network (or, in this setup, over `localhost`):

| Piece | Value | Where it is set |
| --- | --- | --- |
| Backend (Rails API) | `http://localhost:3005` | AmazeZoneAPI compose maps `"3005:3005"` (service `ruby`, container `amazezone_api`) |
| Frontend -> backend URL | `http://localhost:3005` | `app/.env.dev` -> `VITE_RUBY_API_URL` (**required** file; code fallback in `AxiosClient.tsx`) |
| Frontend dev server (host) | `http://localhost:8888` | compose port mapping `${VITE_PORT:-8888}:${VITE_PORT:-3000}`; `VITE_PORT` from the **host** environment, not `app/.env.dev` |
| Frontend dev server (container) | port `3000` | `dev.Dockerfile` (`ARG VITE_PORT=3000`) |
| Backend CORS allowed origins | `http://localhost:5173` + `$VITE_URL` | AmazeZoneAPI `config/initializers/cors.rb` |
| Backend allowed origin for this repo | `http://localhost:8888` | AmazeZoneAPI `BuildTools/.env` -> `VITE_URL` |

**The settings that must match:**

- `VITE_RUBY_API_URL` (frontend) must point at the backend's **published** port
  (3005). If you change the backend's published port, change it here too.
- The backend's `VITE_URL` (CORS) must equal the frontend's **host** port (8888) -
  not the container port (3000). If you change the published port via the host-side
  `VITE_PORT`, update the backend's `VITE_URL` to match the new host port.
- > NOTE: AmazeZoneAPI's `BuildTools/example.env` does not currently include the
  > `VITE_URL` entry (only a local `.env` does). A freshly cloned backend will reject
  > cross-origin requests from `http://localhost:8888` - add
  > `VITE_URL=http://localhost:8888` to the backend's `BuildTools/.env` (or its
  > `example.env`) if you hit CORS errors.

### Authentication flow

Both signup and login follow the same two-step pattern:

1. The client POSTs credentials (`/signup` or `/auth/login`).
2. An `auth_token` is obtained (on signup the backend creates the account and the
   client then calls `/auth/login` with the same credentials to obtain the token) and
   is stored in `localStorage` under `auth_token`.
3. The client calls `GET /auth/current` with `Authorization: Bearer <token>` (attached
   by a request interceptor in `app/src/utils/AxiosClient.tsx` on every request made
   with the auth client) and receives the current user, which drives the
   `/home` route.

## Adding npm dependencies

You do NOT need Node on your host machine - the container installs the packages for
you. `BuildTools/dev.Dockerfile` runs `npm install` at image build time, and the
installed packages are kept in the `node_modules` named volume, so they survive
rebuilds.

1. Add the dependency in `app/` (edit `app/package.json` - pin a `^`-style version to
   match the existing convention; runtime dependencies go in `dependencies`,
   tooling in `devDependencies`).

2. Rebuild the dev image and restart the service so the new package is installed:

   ```pwsh
   .\BuildTools\scripts\compose_project.ps1 -Recreate
   ```

   This runs `docker compose up -d --force-recreate --build`. Note: a plain `up -d`
   does NOT rebuild an existing image. (If you only need the production build,
   rebuild the `frontend` service the same way:
   `docker compose -f BuildTools/docker-compose.yml up -d --build frontend`.)

3. Verify the package was installed:

   ```pwsh
   docker compose -f BuildTools/docker-compose.yml logs frontend_dev
   # or
   docker exec amazezoneapi-vite-dev npm ls some-package
   ```

Notes:
- `package-lock.json` is committed to the repo, so the install is reproducible.
- If the new package does not appear after a rebuild, remove the stale
  `node_modules` volume (`docker volume rm amazezoneapi_frontend_node_modules`) and
  rebuild again - a stale named volume can shadow the image's `node_modules`.

## Production build

The default `frontend` service builds the app (`vite build`) and serves the static
output with **nginx** (`BuildTools/nginx/default_site.conf` includes SPA fallback
routing):

```pwsh
docker compose -f BuildTools/docker-compose.yml up -d
# open http://localhost:8080
```

> NOTE: the production image bakes in whatever environment was present at
> build time - API URLs are part of the compiled bundle, so rebuild after changing
> them.

## Testing

This project is tested with **Vitest** (see `app/src/`). To run the suite, use the
dedicated `test` compose service. Full instructions are in
[`TESTING.md`](TESTING.md).

Quick start (headless / CI):

```bash
docker compose -f BuildTools/docker-compose.yml --profile test run --rm test
```

> The `test` service is gated behind the `test` profile, so a normal
> `docker compose up` (or `BuildTools\scripts\compose_project.ps1 -Start`)
> never starts it - tests only run when you ask for them.

The suite also reports **code coverage** (Vitest + v8):

```bash
docker compose -f BuildTools/docker-compose.yml --profile test run --rm test npm run test:coverage
```

Specs live in `app/src/**/__tests__/` and currently cover every page, component
and utility in `app/src` (statements/lines/functions at 100%); the HTML report
is written to `app/coverage/`. See [TESTING.md](TESTING.md#4-code-coverage) for
details.

## Troubleshooting

- **CORS errors in the browser console** - the backend's CORS allowlist (its
  `VITE_URL` / `cors.rb`) must include the frontend's host origin
  (`http://localhost:8888` by default). See the matching table above.
- **"ECONNREFUSED http://localhost:3005"** - the AmazeZoneAPI backend is not running
  (start its compose stack first), or `VITE_RUBY_API_URL` points at the wrong port.
- **Dev server unreachable on 8888** - check
  `docker compose -f BuildTools/docker-compose.yml ps` and
  `docker compose -f BuildTools/docker-compose.yml logs frontend_dev`; remember the
  host port is 8888 while the container listens on 3000. If you set `VITE_PORT` in
  `app/.env.dev`, that desyncs the mapping - set it in the host shell instead.
- **`env file .../app/.env.dev not found`** - the dev/test services require
  `app/.env.dev`; copy `app/example.env.dev` -> `app/.env.dev` first.
- **Hot reload not picking up edits on Windows** - polling is enabled by default in
  the compose file; if you overrode the environment, keep `CHOKIDAR_USEPOLLING=true`.
- **Package missing inside the container after adding it** - rebuild the image and
  remove the stale `node_modules` volume if necessary (see above).

## VCL Users

VCL is Linux; documentation for getting up and running on VCL with docker is in the
[BuildTools/scripts/vcl/README.md](BuildTools/scripts/vcl/README.md).
