all: prisma-migrate german-states-and-districts-dataset import-datasets

prisma-migrate:
	npm run prisma:migrate

german-states-and-districts-dataset:
	npx ts-node prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts --verbose

import-datasets:
	npx ts-node prisma/scripts/import-datasets/index.ts