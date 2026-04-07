CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."brands" (
    "id" int NOT NULL,
    "name" varchar NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."prices" (
    "id" int NOT NULL,
    "component_id" int NOT NULL,
    "vendor_id" int NOT NULL,
    "price" numeric NOT NULL,
    "recorded_at" timestamp NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."components" (
    "id" int NOT NULL,
    "type_id" int NOT NULL,
    "brand_id" int NOT NULL,
    "name" varchar NOT NULL,
    "model" varchar NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."builds" (
    "id" int NOT NULL,
    "user_id" int NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."build_components" (
    "id" int NOT NULL,
    "build_id" int NOT NULL,
    "component_id" int NOT NULL,
    "quantity" int NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."component_types" (
    "id" int NOT NULL,
    "name" varchar NOT NULL,
    "max_quantity" int NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."vendors" (
    "id" int NOT NULL,
    "name" varchar NOT NULL,
    PRIMARY KEY ("id")
);

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."components" ADD CONSTRAINT "fk_components_type_id_component_types_id" FOREIGN KEY("type_id") REFERENCES "public"."component_types"("id");
ALTER TABLE "public"."components" ADD CONSTRAINT "fk_components_brand_id_brands_id" FOREIGN KEY("brand_id") REFERENCES "public"."brands"("id");
ALTER TABLE "public"."prices" ADD CONSTRAINT "fk_prices_component_id_components_id" FOREIGN KEY("component_id") REFERENCES "public"."components"("id");
ALTER TABLE "public"."prices" ADD CONSTRAINT "fk_prices_vendor_id_vendors_id" FOREIGN KEY("vendor_id") REFERENCES "public"."vendors"("id");
ALTER TABLE "public"."build_components" ADD CONSTRAINT "fk_build_components_component_id_components_id" FOREIGN KEY("component_id") REFERENCES "public"."components"("id");
ALTER TABLE "public"."build_components" ADD CONSTRAINT "fk_build_components_build_id_builds_id" FOREIGN KEY("build_id") REFERENCES "public"."builds"("id");