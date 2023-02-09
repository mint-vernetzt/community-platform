ifneq (,$(wildcard ./.env))
    include .env
endif

.DEFAULT_GOAL := help

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

all: prisma-migrate german-states-and-districts-dataset import-datasets create-profile-trigger create-buckets apply-bucket-rls imgproxy ## Run prisma-migrate -> german-states-and-districts-dataset -> import-datasets -> create-profile-trigger -> create-buckets -> apply-bucket-rls -> imgproxy

prisma-migrate: ## Migrate the prisma database
	npm run prisma:migrate

german-states-and-districts-dataset: ## Import german states and districts into the database as areas, states and districts (see prisma.schema for more details)
	npx ts-node prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts

import-datasets: ## Import other static datasets (located in ./prisma/scripts/import-datasets/data/)
	npx ts-node prisma/scripts/import-datasets/index.ts

create-profile-trigger: ## Creates the profile trigger, which creates a public profile everytime a user is created on the auth.users table
	npx ts-node prisma/scripts/create-profile-trigger/index.ts

create-buckets: ## Create supabase buckets
	npx ts-node supabase/scripts/create-buckets/index.ts

apply-bucket-rls: ## Applies the RLS policies for the supabase storage buckets
	npx ts-node prisma/scripts/apply-bucket-rls/index.ts

imgproxy: ## Start imgproxy
	docker run --rm -p 8080:8080 --network supabase_network_community-platform -e IMGPROXY_KEY -e IMGPROXY_SALT --name imgproxy -itd darthsim/imgproxy
	
imgproxy_stop: ## stop imgproxy
	docker stop `docker ps --format "{{.ID}}" --filter name=imgproxy`

update-score: ## update score of profiles and organizations
	npx ts-node prisma/scripts/update-score/index.ts