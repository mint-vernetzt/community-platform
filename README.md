# MINT Community Platform

## Prerequisites

Please note, that you will need an up and running **Docker** instance to operate the project locally. Also, **Node.js** is mandatory.

## Initial Bootstrap

The following steps are mandatory in order to put the project into operation for local development:

### 1. Install Supabase

You will find a detailed description of the installation process at [Supabase "getting started" documentation](https://supabase.com/docs/guides/cli/getting-started).
Please note that you will need a local Docker instance up and running for this.

On startup, via `supabase start`, supabase will provide all required information for further configuration.
Alternatively use `supabase status` at runtime:

```dotenv
              API URL: http://localhost:54321
          GraphQL URL: http://localhost:54321/graphql/v1
               DB URL: postgresql://postgres:postgres@localhost:54322/postgres
           Studio URL: http://localhost:54323
         Inbucket URL: http://localhost:54324
           JWT secret: xxx-xxx-xxx-xxx-xxx
             anon key: xxx-xxx-xxx-xxx-xxx
     service_role key: xxx-xxx-xxx-xxx-xxx
```

The [Studio URL](http://localhost:54323) leads to Supabase studio, an administrative interface for Supabase.
Supabase inbucket is a container for all e-mails sent by Supabase. These e-mails can be viewed under the [Inbucket URL](http://localhost:54324).

### 2. Create your local .env file

The easiest way is to copy the `.env.example` file and adjust the important entries accordingly by the values of `supabase status`:

```dotenv
SUPABASE_ANON_KEY="xxx-xxx-xxx-xxx-xxx"
SERVICE_ROLE_KEY="xxx-xxx-xxx-xxx-xxx"
SUPABASE_URL="http://localhost:54321"
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
# ...
```

### 3. Start local imgproxy

A local [imgproxy](https://imgproxy.net/) instance is required for most of the graphics contained in the project. The easiest way to put this into operation is via `make`:

```shell
# Start imgproxy
make imgproxy

# Stop imgproxy
make imgproxy_stop
```

### 4. Seed database

Run the script

```shell
npx ts-node prisma/scripts/seed-database/index.ts -s 2 -r -e 1 -i 1 -d 1
```

this will seed the database with random but reasonably data.

### 5. Copy fonts

To use the custom fonts integrated in the project, they must be copied to a local directory using a script.

```shell
npm run copy:fonts
```

## Run DEV

```shell
npm run dev
```

## Run PROD

```shell
npm run build
npm run start
```

## Storybook

Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

## Deployment

Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

## Further information

- [Remix Docs](https://remix.run/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs/orm)
- [DaisyUI](https://daisyui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
