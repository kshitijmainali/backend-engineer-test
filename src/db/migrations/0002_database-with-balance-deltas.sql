CREATE TABLE "balance_deltas" (
	"address" text PRIMARY KEY NOT NULL,
	"balance" numeric DEFAULT '0' NOT NULL,
	"block_height" integer
);
--> statement-breakpoint
CREATE TABLE "spent_outputs" (
	"tx_id" text NOT NULL,
	"index" integer NOT NULL,
	"spent_at_height" integer NOT NULL,
	"spent_by_transaction_id" text NOT NULL,
	CONSTRAINT "spent_outputs_tx_id_index_pk" PRIMARY KEY("tx_id","index")
);
--> statement-breakpoint
ALTER TABLE "balances" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "balances" CASCADE;--> statement-breakpoint
ALTER TABLE "outputs" DROP CONSTRAINT "outputs_block_height_blocks_height_fk";
--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "spent_outputs" ADD CONSTRAINT "spent_outputs_tx_id_transactions_id_fk" FOREIGN KEY ("tx_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spent_outputs" ADD CONSTRAINT "spent_outputs_spent_by_transaction_id_transactions_id_fk" FOREIGN KEY ("spent_by_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" DROP COLUMN "spent";--> statement-breakpoint
ALTER TABLE "outputs" DROP COLUMN "block_height";