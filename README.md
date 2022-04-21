# Overview

# First steps

- create `.env` file in root directory (or copy and rename `.env.example`)
- set `SUPABASE_ANON_KEY`, `SESSION_SECRET` and `SUPABASE_URL` (supabase)
- set `DATABASE_URL` (prisma)

## Generate files

Run `npm run create` and select generator:

- **route** - Create route
- **component** - Create component
- **test** - Create component test
- **stories** - Create component stories

## Fonts

To use custom fonts we have to add font files from @fontsource to public folder. Just run `npm run copy:fonts` to do so. If you need more fonts or font faces add them to the script.

# Local Supabase

Requirements [docker](https://docs.docker.com/get-docker/), [supabase cli](https://supabase.com/docs/reference/cli/installing-and-updating)

1. run `supabase start`
1. copy values of `anon key`, `API URL` and `DB URL` to the `.env` file
1. run `make`
1. browse to `Studio URL` and copy paste content of `supabase.enhancement.sql` to **SQL Editor** and run command

# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

### Using a Template

When you ran `npx create-remix@latest` there were a few choices for hosting. You can run that again to create a new project, then copy over your `app/` folder to the new project that's pre-configured for your target server.

```sh
cd ..
# create a new project, and pick a pre-configured host
npx create-remix@latest
cd my-new-remix-app
# remove the new project's app (not the old one!)
rm -rf app
# copy your app over
cp -R ../my-old-remix-app/app app
```
