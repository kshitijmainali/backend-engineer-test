CREATE TYPE "public"."transaction_type" AS ENUM('input', 'output');--> statement-breakpoint
CREATE TABLE "balance_deltas" (
	"address" text NOT NULL,
	"balance_delta" numeric DEFAULT '0' NOT NULL,
	"block_height" integer NOT NULL,
	CONSTRAINT "balance_deltas_address_block_height_pk" PRIMARY KEY("address","block_height")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_height_unique" UNIQUE("height")
);
--> statement-breakpoint
CREATE TABLE "outputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_id" text NOT NULL,
	"index" integer NOT NULL,
	"address" text NOT NULL,
	"block_height" integer NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"block_height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance_deltas" ADD CONSTRAINT "balance_deltas_block_height_blocks_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."blocks"("height") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_tx_id_transactions_id_fk" FOREIGN KEY ("tx_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_block_height_blocks_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."blocks"("height") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spent_outputs" ADD CONSTRAINT "spent_outputs_tx_id_transactions_id_fk" FOREIGN KEY ("tx_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spent_outputs" ADD CONSTRAINT "spent_outputs_spent_by_transaction_id_transactions_id_fk" FOREIGN KEY ("spent_by_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_block_height_blocks_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."blocks"("height") ON DELETE cascade ON UPDATE no action;