# Workflows

To automate running the [scripts](./scripts.md), we use [GitHub Actions workflows](https://docs.github.com/en/actions/using-workflows).

Each workflow includes its own set of scripts that can be run either manually or in response to a repository event.

## check

Sequentially runs the `api:load`, `playlist:lint`, and `playlist:validate` scripts whenever a new pull request is opened, blocking the merge if it detects any errors.

## format

Sequentially runs the `api:load`, `playlist:format`, `playlist:lint`, and `playlist:validate` scripts.

## update

Runs every day at 0:00 UTC. It sequentially executes the `api:load`, `playlist:update`, `playlist:lint`, `playlist:validate`, `playlist:generate`, `playlist:export`, and `readme:update` scripts, then automatically deploys the updated files if successful.
