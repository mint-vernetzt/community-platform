all: prisma-migrate german-states-and-districts-dataset

prisma-migrate:
	npm run prisma:migrate

german-states-and-districts-dataset:
	npx ts-node prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts --verbose
