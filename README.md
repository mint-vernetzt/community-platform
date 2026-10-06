# MINT Community Platform

## Prerequisites

Please note, that you will need an up and running **Docker** instance to operate the project locally. Also, **Node.js** is mandatory.

## Initial Bootstrap

The following steps are mandatory in order to put the project into operation for local development:

### 1. Install Supabase

_Update:_ The project has moved to self-hosted supabase for local development. Using it as explained below (with the Supabase cli) might need some tweaks. For self-hosting supabase follow this [Self-hosted Supabase Guide](https://supabase.com/docs/guides/self-hosting/docker) and look into the [Supabase Docker Repository](https://github.com/supabase/supabase/tree/master/docker)

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
make seed-database
```

this will seed the database with random but reasonably data.

## Run DEV

```shell
npm run dev
```

## Run PROD

```shell
npm run build
npm run start
```

## Further information

- [React Router Docs](https://reactrouter.com/home)
- [Supabase Docs](https://supabase.com/docs)
- [Self-hosted Supabase Guide](https://supabase.com/docs/guides/self-hosting/docker)
- [Supabase Docker Repository](https://github.com/supabase/supabase/tree/master/docker)
- [Prisma Docs](https://www.prisma.io/docs/orm)
- [Tailwind CSS](https://tailwindcss.com/)
