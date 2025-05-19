CREATE TYPE "public"."software_type" AS ENUM('QuickBooks', 'Xero');--> statement-breakpoint
CREATE TABLE "softwares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"software_type" "software_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_data" text NOT NULL,
	"date_created" timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
	"date_updated" timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
	CONSTRAINT "user_software" UNIQUE("user_id","software_type")
);
--> statement-breakpoint
ALTER TABLE "softwares" ADD CONSTRAINT "softwares_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;