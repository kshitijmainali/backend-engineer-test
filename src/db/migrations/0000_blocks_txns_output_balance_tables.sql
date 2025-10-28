CREATE TYPE "public"."transaction_type" AS ENUM('input', 'output');--> statement-breakpoint
CREATE TABLE "balances" (
	"address" text PRIMARY KEY NOT NULL,
	"balance" numeric DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"amount" numeric NOT NULL,
	"spent" boolean DEFAULT false NOT NULL,
	"block_height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"block_height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_tx_id_transactions_id_fk" FOREIGN KEY ("tx_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_block_height_blocks_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."blocks"("height") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_block_height_blocks_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."blocks"("height") ON DELETE cascade ON UPDATE no action;