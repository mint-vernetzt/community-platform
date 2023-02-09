ifneq (,$(wildcard ./.env))
    include .env
endif

.DEFAULT_GOAL := help

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

all: prisma-migrate german-states-and-districts-dataset import-datasets create-buckets imgproxy ## Run prisma-migrate -> german-states-and-districts-dataset -> import-datasets -> create-buckets -> imgproxy

prisma-migrate: ## Migrate the prisma database
	npm run prisma:migrate

german-states-and-districts-dataset: ## Import german states and districts into the database as areas, states and districts (see prisma.schema for more details)
	npx ts-node prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts --verbose

import-datasets: ## Import other static datasets (located in ./prisma/scripts/import-datasets/data/)
	npx ts-node prisma/scripts/import-datasets/index.ts

create-buckets: ## Create supabase buckets
	npx ts-node supabase/scripts/create-buckets/index.ts

imgproxy: ## Start imgproxy
	docker run --rm -p 8080:8080 --network supabase_network_community-platform -e IMGPROXY_KEY -e IMGPROXY_SALT --name imgproxy -itd darthsim/imgproxy
	
imgproxy_stop: ## stop imgproxy
	docker stop `docker ps --format "{{.ID}}" --filter name=imgproxy`

update-score: ## update score of profiles and organizations
	npx ts-node prisma/scripts/update-score/index.ts