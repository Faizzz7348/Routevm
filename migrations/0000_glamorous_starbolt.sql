CREATE TABLE "layout_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default' NOT NULL,
	"column_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"column_visibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creator_name" text DEFAULT 'Somebody' NOT NULL,
	"creator_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_optimization_result" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_order" jsonb NOT NULL,
	"optimized_order" jsonb NOT NULL,
	"original_distance" numeric(8, 2) NOT NULL,
	"optimized_distance" numeric(8, 2) NOT NULL,
	"time_saved" numeric(8, 2) NOT NULL,
	"fuel_saved" numeric(8, 2) NOT NULL,
	"algorithm" text DEFAULT 'nearest_neighbor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table_columns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"data_key" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_editable" text DEFAULT 'true' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "table_rows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no" integer DEFAULT 0 NOT NULL,
	"route" text DEFAULT '' NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"trip" text DEFAULT '' NOT NULL,
	"info" text DEFAULT '' NOT NULL,
	"tng_site" text DEFAULT '' NOT NULL,
	"tng_route" text DEFAULT '' NOT NULL,
	"destination" text DEFAULT '0.00' NOT NULL,
	"kilometer" text DEFAULT '0.00' NOT NULL,
	"toll_price" text DEFAULT '0.00' NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"qr_code" text DEFAULT '',
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "layout_user_id_idx" ON "layout_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_one_special_sortorder" ON "table_rows" USING btree ("sort_order") WHERE "table_rows"."sort_order" = -1;