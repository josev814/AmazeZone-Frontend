# VCL Setup

## Git

On VCL

generate an ssh key for github

```bash
ssh-keygen -t ed25519 -C "<your_email>"
```

`cat` the location of your .pub key which should be under `/home/<your_user>/.ssh/`

Add that as a deployment key for your git repository on Github

### Clone the repository

Make sure to update the github username in the commands below

On VCL

```bash
sudo apt-get update
sudo apt-get install git -y
eval $(ssh-agent -s)
ssh-add ~/.ssh/<your_ssh_key>
mkdir -p ~/app
cd ~/app
git clone git@github.com:<your_github_username>/AmazeZone-Frontend.git .
```

## Docker
### Install dependencies
This installs docker and its dependencies along with vim and htop

```bash
bash BuildTools/scripts/vcl/docker_setup.sh
```

### Standup the containers
Run the compose_project.sh with --start, but do so from the root of the project (~/app)

```bash
bash BuildTools/scripts/vcl/compose_project.sh --start
```
This starts the default `frontend` service: the production build, served by nginx
on port 8080 (`http://localhost:8080`).

> The script copies `BuildTools/example.env` to `BuildTools/.env` if the former
> exists and the latter does not - this repo does not ship a
> `BuildTools/example.env`, so that step is a no-op. The environment file this
> project actually uses is `app/.env.dev` (create it from `app/example.env.dev`).
> It is **required** for the `frontend_dev` and `test` services: the compose file
> declares it with `required: true`, and without it the dev stack fails to start
> with `env file .../.env.dev not found`.

The development server (Vite, with hot module reload) is gated behind the
`development` profile, so start it explicitly:

```bash
sudo docker compose -f BuildTools/docker-compose.yml --profile development up -d frontend_dev
```

It will then be accessible over port 8888 (`http://localhost:8888`).

A normal `--start` uses the existing image (it is only built if it is missing).
Pass `--build` to force a rebuild of the image first (e.g. after changing the
`package.json`/`package-lock.json` or the dockerfile):

```bash
bash BuildTools/scripts/vcl/compose_project.sh --start --build
```

You can verify the dev server is up by running

```bash
sudo docker logs --follow amazezoneapi-vite-dev
```

You'll see this output in the logs

```
  VITE v4.4.9  ready in 480 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://172.17.0.2:3000/
```

Since we're running in dev mode you will see other output in the logs like
`[vite] hmr update /src/pages/Home.tsx` when files change - that's Vite's hot
module reload picking up the edit.

### Teardown the containers
This can be helpful if we sync code and it doesn't update.

Just have the project tear down and then start again to rebuild it.

```bash
bash BuildTools/scripts/vcl/compose_project.sh --stop
```
This prompts about cleaning up the project's volumes and images (default: no).
Pass `--remove-volumes` / `--remove-images` to clean those up without prompting.
