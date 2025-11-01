import type { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const transactionType = pgEnum('transaction_type', ['input', 'output']);

export const blocks = pgTable('blocks', {
  id: text('id').primaryKey(),
  height: integer('height').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  blockHeight: integer('block_height')
    .notNull()
    .references(() => blocks.height, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const outputs = pgTable('outputs', {
  id: serial('id').primaryKey(),
  txId: text('tx_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  address: text('address').notNull(),
  amount: numeric('amount').notNull(),
  spent: boolean('spent').notNull().default(false),
  blockHeight: integer('block_height')
    .notNull()
    .references(() => blocks.height, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const balances = pgTable('balances', {
  address: text('address').primaryKey(),
  balance: numeric('balance').notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export type OutputTableRow = InferSelectModel<typeof outputs>;
export type BalanceTableRow = InferSelectModel<typeof balances>;
