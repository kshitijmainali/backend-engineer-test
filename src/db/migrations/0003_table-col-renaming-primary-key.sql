/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'balance_deltas'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "balance_deltas" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "balance_deltas" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "balance_deltas" ADD CONSTRAINT "balance_deltas_address_block_height_pk" PRIMARY KEY("address","block_height");--> statement-breakpoint
ALTER TABLE "balance_deltas" ADD COLUMN "balance_delta" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "balance_deltas" DROP COLUMN "balance";