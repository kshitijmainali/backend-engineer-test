import { type InferSelectModel } from 'drizzle-orm';
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const transactionType = pgEnum('transaction_type', ['input', 'output']);

export const blocks = pgTable('blocks', {
  id: text('id').notNull().primaryKey(),
  height: integer('height').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').notNull().primaryKey(),
  blockHeight: integer('block_height')
    .notNull()
    .references(() => blocks.height, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const outputs = pgTable('outputs', {
  id: serial('id').notNull().primaryKey(),
  txId: text('tx_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  address: text('address').notNull(),
  blockHeight: integer('block_height')
    .notNull()
    .references(() => blocks.height, { onDelete: 'cascade' }),
  amount: numeric('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const spentOutputs = pgTable(
  'spent_outputs',
  {
    txId: text('tx_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    index: integer('index').notNull(),
    spentAtHeight: integer('spent_at_height').notNull(),
    spentByTransactionId: text('spent_by_transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.txId, table.index] })]
);

export const balanceDeltas = pgTable(
  'balance_deltas',
  {
    address: text('address').notNull(),
    balanceDelta: numeric('balance_delta').notNull().default('0'),
    blockHeight: integer('block_height').notNull(),
  },
  (table) => [primaryKey({ columns: [table.address, table.blockHeight] })]
);

export type OutputTableRow = InferSelectModel<typeof outputs>;
export type BalanceDeltaTableRow = InferSelectModel<typeof balanceDeltas>;
export type BlockTableRow = InferSelectModel<typeof blocks>;
export type TransactionTableRow = InferSelectModel<typeof transactions>;
export type SpentOutputTableRow = InferSelectModel<typeof spentOutputs>;
