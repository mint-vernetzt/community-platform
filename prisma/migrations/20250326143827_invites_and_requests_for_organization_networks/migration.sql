-- CreateTable
CREATE TABLE "invites_for_organizations_to_join_networks" (
    "organization_id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_for_organizations_to_join_networks_pkey" PRIMARY KEY ("organization_id","network_id")
);

-- CreateTable
CREATE TABLE "requests_to_networks_to_add_organizations" (
    "network_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_to_networks_to_add_organizations_pkey" PRIMARY KEY ("network_id","organization_id")
);

-- AddForeignKey
ALTER TABLE "invites_for_organizations_to_join_networks" ADD CONSTRAINT "invites_for_organizations_to_join_networks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_for_organizations_to_join_networks" ADD CONSTRAINT "invites_for_organizations_to_join_networks_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests_to_networks_to_add_organizations" ADD CONSTRAINT "requests_to_networks_to_add_organizations_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests_to_networks_to_add_organizations" ADD CONSTRAINT "requests_to_networks_to_add_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
