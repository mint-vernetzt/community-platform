all: prisma-migrate german-states-and-districts-dataset offer-dataset

prisma-migrate:
	npm run prisma:migrate

german-states-and-districts-dataset:
	npx ts-node prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts --verbose

import-static-datasets:
	npx ts-node prisma/scripts/import-static-datasets/index.ts