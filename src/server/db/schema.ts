// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  varchar,
  char,
  date,
  unique,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `golfsync_${name}`);

// Members table
export const members = createTable(
  "members",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    class: varchar("class", { length: 50 }).notNull(),
    memberNumber: varchar("member_number", { length: 20 }).notNull(),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }).notNull(),
    username: varchar("username", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    gender: char("gender", { length: 1 }),
    dateOfBirth: date("date_of_birth"),
    handicap: varchar("handicap", { length: 20 }),
    bagNumber: varchar("bag_number", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    // Unique constraints
    unique("members_org_member_number_unq").on(
      table.clerkOrgId,
      table.memberNumber,
    ),
    unique("members_org_username_unq").on(table.clerkOrgId, table.username),
    // Removed email unique constraint temporarily
    // unique("members_org_email_unq").on(table.clerkOrgId, table.email),
    // Indexes
    index("members_org_id_idx").on(table.clerkOrgId),
    index("members_first_name_idx").on(table.firstName),
    index("members_last_name_idx").on(table.lastName),
  ],
);

// Teesheet configurations
export const teesheetConfigs = createTable(
  "teesheet_configs",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    interval: integer("interval").notNull(),
    maxMembersPerBlock: integer("max_members_per_block").notNull().default(4),
    isActive: boolean("is_active").notNull().default(true),
    isSystemConfig: boolean("is_system_config").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    unique("configs_org_name_unq").on(table.clerkOrgId, table.name),
    index("configs_org_id_idx").on(table.clerkOrgId),
  ],
);

// Configuration rules for when to apply each config
export const teesheetConfigRules = createTable(
  "teesheet_config_rules",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    configId: integer("config_id")
      .references(() => teesheetConfigs.id, { onDelete: "cascade" })
      .notNull(),
    daysOfWeek: integer("days_of_week").array(), // [1,2,3,4] for Mon-Thu
    startDate: date("start_date"), // null for recurring
    endDate: date("end_date"), // null for recurring
    priority: integer("priority").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("rules_org_id_idx").on(table.clerkOrgId),
    index("rules_config_id_idx").on(table.configId),
    index("rules_days_of_week_idx").on(table.daysOfWeek),
  ],
);

// Define relations
export const teesheetConfigsRelations = relations(
  teesheetConfigs,
  ({ many }) => ({
    rules: many(teesheetConfigRules),
  }),
);

export const teesheetConfigRulesRelations = relations(
  teesheetConfigRules,
  ({ one }) => ({
    config: one(teesheetConfigs, {
      fields: [teesheetConfigRules.configId],
      references: [teesheetConfigs.id],
    }),
  }),
);

// Teesheets table
export const teesheets = createTable(
  "teesheets",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    configId: integer("config_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    unique("teesheets_org_date_unq").on(table.clerkOrgId, table.date),
    index("teesheets_org_id_idx").on(table.clerkOrgId),
    index("teesheets_date_idx").on(table.date),
  ],
);

// Time blocks
export const timeBlocks = createTable(
  "time_blocks",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    teesheetId: integer("teesheet_id")
      .references(() => teesheets.id, { onDelete: "cascade" })
      .notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("blocks_org_id_idx").on(table.clerkOrgId),
    index("blocks_teesheet_id_idx").on(table.teesheetId),
    index("blocks_start_time_idx").on(table.startTime),
  ],
);

// Time block members (join table)
export const timeBlockMembers = createTable(
  "time_block_members",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    timeBlockId: integer("time_block_id")
      .references(() => timeBlocks.id, { onDelete: "cascade" })
      .notNull(),
    memberId: integer("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("block_members_org_id_idx").on(table.clerkOrgId),
    index("block_members_time_block_id_idx").on(table.timeBlockId),
    index("block_members_member_id_idx").on(table.memberId),
    unique("block_members_time_block_member_unq").on(
      table.timeBlockId,
      table.memberId,
    ),
  ],
);
