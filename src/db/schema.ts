import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  nickname: text('nickname'),
  dateOfBirth: text('date_of_birth'), 
  gender: text('gender'),
  location: text('location'),
  occupation: text('occupation'),
  relationshipStatus: text('relationship_status'),
  recentEvents: text('recent_events'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const authProviders = sqliteTable('auth_providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const creditWallets = sqliteTable('credit_wallets', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  currency: text('currency').default('VND'),
  status: text('status').notNull(),
  paymentGateway: text('payment_gateway'),
  gatewayTransactionId: text('gateway_transaction_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const creditTransactions = sqliteTable('credit_transactions', {
  id: text('id').primaryKey(),
  walletId: text('wallet_id').notNull().references(() => creditWallets.userId, { onDelete: 'cascade' }),
  paymentTransactionId: text('payment_transaction_id').references(() => paymentTransactions.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  transactionType: text('transaction_type').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const tarotReadings = sqliteTable('tarot_readings', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().unique().references(() => conversations.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  cardsPayload: text('cards_payload').notNull(), 
  spreadType: text('spread_type').default('single_card'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const messageLogs = sqliteTable('message_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), 
  content: text('content').notNull(),
  model: text('model'),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
