import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const blocks = pgTable("blocks", {
  id: text("id").primaryKey(),
  height: integer("height").notNull().unique()
});
