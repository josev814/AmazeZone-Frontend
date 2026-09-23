# Testing AmazeZone-Frontend

This document explains how to run the **Vitest** test suite for this React +
TypeScript app, how the test environment is wired into our Docker setup, and how to
write and extend specs. It covers both the day-to-day developer workflow (attaching to
the container from VS Code) and a headless/CI workflow (a dedicated `test` compose
service).

> Spec files live in `app/src/` (the convention used by this repo is
> `*.test.ts(x)` or a `__tests__/` folder next to the code under test). The
> suite currently contains 13 spec files under `app/src/**/__tests__/`
> (auth flow, product list/detail/form/delete, routing, the axios client and
> the app entry point) and reports code coverage with the v8 provider - see
> [Code coverage](#4-code-coverage).
>
> The specs run in jsdom inside the `frontend_dev` container, and **every HTTP
> call is mocked at the `AxiosClient` module level** - so the test suite
> works with the AmazeZoneAPI backend (Ruby) completely down. See
> [Writing more specs](#3-writing-more-specs) for the mocking pattern.

---

## 1. How the frontend environment flows through Docker

The single most important idea: **Node and npm are not installed on your host - they
only exist inside the container.** The dev image (`BuildTools/dev.Dockerfile`) runs
`npm install` at build time and installs into the `node_modules` named volume, so the
container always has the full toolchain (Vite, Vitest, TypeScript, …).

Everything the tests need is driven by the npm scripts in `app/package.json`:

| Script | Command | Purpose |
| --- | --- | --- |
| `test` | `vitest` | Interactive watch mode (re-runs on edit) |
| `test:dev` | `vitest run --passWithNoTests` | One-shot, CI-style run |
| `test:coverage` | `vitest run --coverage` | One-shot run with v8 code-coverage reporting |

The `test` compose service ties this together:

- reuses the **dev image** (`amazezoneapi_vite_frontend:local-dev`) and bind-mounts
  `app/`, so spec edits are picked up without a rebuild - only `package.json` changes
  need a rebuild;
- runs `npm run test:dev` and exits (exit code 0 = pass, non-zero = failure);
- sets `restart: "no"` on purpose, so a one-shot run is never restarted by Docker
  after it exits (pass or fail);
- sits behind the **`test` profile**, so a normal `docker compose up` (or
  `BuildTools\scripts\compose_project.ps1 -Start`) never starts the tests.

So just like the backend, **you do not run tests "against the dev server"** - the test
run and the dev server can share the same image; only the command differs.

---

## 2. Two ways to run the suite

### A. Headless / CI (the compose `test` service)

```bash
docker compose -f BuildTools/docker-compose.yml --profile test run --rm test
```

- runs `npm run test:dev` in a one-shot container (`amazezoneapi-vitest`) and exits;
- you can override the command to run a subset, e.g.:

  ```bash
  docker compose -f BuildTools/docker-compose.yml --profile test run --rm test npx vitest run src/pages/__tests__/Login.test.tsx
  ```

- because the `test` service is behind the `test` profile, a plain `up` never starts
  it - tests only run when you ask for them.

### B. Attach from VS Code (recommended for day-to-day)

The intended workflow is to attach your editor to the running container using the
**Microsoft Dev Containers** extension, which gives you a terminal *inside* the
container (with its Node/npm/Vitest).

1. Start the dev stack (this starts the `frontend_dev` service):

   ```powershell
   docker compose -f BuildTools\docker-compose.yml --profile development up -d frontend_dev
   ```

2. In VS Code, use **Dev Containers: Attach to Running Container…** and pick the
   `amazezoneapi-vite-dev` container.

3. Open the VS Code integrated terminal (it now runs inside the container) and run:

   ```bash
   # one-shot (CI-style):
   npm run test:dev

   # interactive watch mode:
   npm run test

   # a single file:
   npx vitest run src/pages/__tests__/Login.test.tsx
   ```

---

## 3. Writing more specs

The test tooling is already set up: `app/package.json` has the React Testing
Library + jsdom + coverage devDependencies, `app/vite.config.ts` has the vitest
`test` block (jsdom environment, `./src/setupTests.ts` setup file), and
`app/src/setupTests.ts` loads the jest-dom matchers, enables
`IS_REACT_ACT_ENVIRONMENT`, and registers RTL cleanup after every test (RTL
only auto-registers cleanup when a global `afterEach` exists, which it does
not with vitest globals disabled).

To add a spec, e.g. `app/src/pages/__tests__/about.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'

describe('Login page', () => {
  it('renders the form fields', () => {
    render(
      <MemoryRouter>
        <Login handleLogin={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })
})
```

then run it (either workflow above) and watch it go green.

Notes:

- Import `describe`/`it`/`expect` from `'vitest'` explicitly - the project does not
  enable vitest globals.
- Components that use `react-router-dom` hooks must be rendered inside a router
  (`<MemoryRouter>` in tests).
- API calls go through `app/src/utils/AxiosClient.tsx`; mock the module with
  `vi.mock('../../utils/AxiosClient', ...)` **above** the component import when a
  spec should not hit the network, and use `vi.clearAllMocks()` in `beforeEach`
  when a test asserts on call counts.
- `user-event` is not concurrency-safe: type fields with sequential `await`s,
  never with `Promise.all`.
- React 18 state updates are async - assert async outcomes with `findBy*` /
  `waitFor` so updates flush inside `act()`.

---

## 4. Code coverage

Coverage uses the **v8** provider (`@vitest/coverage-v8`, version-pinned to the
installed vitest). It is configured in `app/vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary', 'html', 'json-summary'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/vite-env.d.ts'],
    all: true, // files that no spec imports are still reported (at 0%)
  },
},
```

Run it from an attached container, or headless via the `test` service with a
command override:

```bash
npm run test:coverage
```

```bash
docker compose -f BuildTools/docker-compose.yml --profile test run --rm test npm run test:coverage
```

- the per-file table and the summary print to the console;
- the HTML report is written to `app/coverage/` (open `index.html`; branch
  coverage is shown per line - green = fully covered, yellow = partial);
- `coverage-summary.json` is written alongside for tooling/CI.

The current specs cover **all** of `app/src` - `main.tsx`, `App.tsx`, all four
pages, all five components, and both utilities - at **100% statements, lines,
functions and branches**. When you add code, keep it that way: untested code
shows up as a yellow/red line in the HTML report, and the summary percentage
drops.

---

## 5. Troubleshooting

- **`vitest: not found` inside the container** - the `node_modules` named volume may
  be stale (created before `vitest` was added to `package.json`). Rebuild the image
  (`compose_project.ps1 -Recreate`); if it still fails, remove the stale volume
  (`docker volume rm amazezoneapi_frontend_node_modules`) and rebuild again.
- **`env file .../app/.env.dev not found`** - the `test` service (like `frontend_dev`)
  declares `app/.env.dev` as a **required** `env_file`. Copy
  `app/example.env.dev` -> `app/.env.dev` before running the suite
  (instructions: [BuildTools/README.md](BuildTools/README.md)).
- **"No test files found" failure** - the one-shot service uses
  `--passWithNoTests` on purpose; if you add a stricter command yourself, add a spec
  first.
- **Port confusion** - tests do not use the dev server port; `VITE_PORT` (3000 in the
  container, 8888 on the host) only concerns the dev server and the backend CORS
  allowlist. See the root README's
  [How it connects to AmazeZoneAPI](README.md#how-it-connects-to-amazezoneapi).
- **Stale specs after dependency changes** - rebuild the image (and the
  `node_modules` volume if necessary) before assuming the spec is broken.

---

In case of any issues, don't hesitate to open an issue on the
[GitHub repository](https://github.com/efg/AmazeZone-Frontend) for assistance, or post
on Moodle.