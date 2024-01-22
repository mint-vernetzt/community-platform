ifneq (,$(wildcard ./.env))
    include .env
endif

.DEFAULT_GOAL := help

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

project: prisma-migrate german-states-and-districts-dataset import-datasets create-buckets apply-bucket-rls ## Run prisma-migrate -> german-states-and-districts-dataset -> import-datasets -> create-buckets -> apply-bucket-rls

prisma-migrate: ## Migrate the prisma database
	npm run prisma:migrate

german-states-and-districts-dataset: ## Import german states and districts into the database as areas, states and districts (see prisma.schema for more details)
	npx tsx prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts

import-datasets: ## Import other static datasets (located in ./prisma/scripts/import-datasets/data/)
	npx tsx prisma/scripts/import-datasets/index.ts

apply-create-profile-trigger: ## Applies the "create profile" trigger, which creates a public profile everytime a user is created on the auth.users table
	npx tsx prisma/scripts/apply-create-profile-trigger/index.ts

create-buckets: ## Create supabase buckets
	npx tsx supabase/scripts/create-buckets/index.ts

apply-bucket-rls: ## Applies the RLS policies for the supabase storage buckets
	npx tsx prisma/scripts/apply-bucket-rls/index.ts

imgproxy: ## Start imgproxy
	docker run --rm -p 8080:8080 --network supabase_network_community-platform -e IMGPROXY_KEY -e IMGPROXY_SALT --name imgproxy -itd darthsim/imgproxy
	
imgproxy_stop: ## Stop imgproxy
	docker stop `docker ps --format "{{.ID}}" --filter name=imgproxy`

update-score: ## Update score of profiles and organizations
	npx tsx prisma/scripts/update-score/index.ts

seed-database: ## Seed the database with fake data
	npx tsx prisma/scripts/seed-database/index.ts

truncate-tables: ## Truncate all database tables except the migration table
	npx tsx prisma/scripts/truncate-tables/index.ts

delete-users: ## Delete all users on the auth.users table
	npx tsx supabase/scripts/delete-users/index.ts

empty-buckets: ## Empty all buckets in supabase storage if they exist
	npx tsx supabase/scripts/empty-buckets/index.ts

download-storage-objects: ## Downloading all storage objects from supabase storage (Please look at the script and the .env.example located in "./supabase/scripts/download-storgae-objects/" before executing)
	npx tsx supabase/scripts/download-storage-objects/index.ts

migrate-storage-objects: ## Migrating all storage objects from old supabase storage to the new supabase storage (Please look at the script and the .env.example located in "./supabase/scripts/migrate-storgae-objects/" before executing)
	npx tsx supabase/scripts/download-storage-objects/index.ts