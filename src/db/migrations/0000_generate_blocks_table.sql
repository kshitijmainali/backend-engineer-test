CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "blocks_height_unique" UNIQUE("height")
);
