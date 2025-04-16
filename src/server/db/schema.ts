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
    // Unique constraints (automatically create necessary indexes)
    unique("member_number_unq").on(table.memberNumber),
    // Consider adding unique constraints for username and email if applicable
    // unique("username_unq").on(table.username),
    // unique("email_unq").on(table.email),

    // Indexes for performance based on common search patterns
    index("first_name_idx").on(table.firstName), // Keep if searching only by first name is common
    index("last_name_idx").on(table.lastName), // Keep if searching only by last name is common

    // Optional: Consider replacing the two above with this if combined search is primary
    // index("name_idx").on(table.lastName, table.firstName),
  ],
);

// Teesheet configurations
export const teesheetConfigs = createTable(
  "teesheet_configs",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 50 }).notNull(), // e.g., "Weekday", "Weekend", "Holiday"
    description: varchar("description", { length: 200 }),
    startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
    endTime: varchar("end_time", { length: 5 }).notNull(), // "18:00"
    interval: integer("interval").notNull(), // 10 or 15 (minutes)
    maxMembersPerBlock: integer("max_members_per_block").notNull().default(4),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [unique("name_unq").on(table.name)],
);

// Configuration rules for when to apply each config
export const teesheetConfigRules = createTable(
  "teesheet_config_rules",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    configId: integer("config_id")
      .references(() => teesheetConfigs.id, { onDelete: "cascade" })
      .notNull(),
    dayOfWeek: integer("day_of_week"), // 0-6 (Sunday-Saturday), null for all days
    isWeekend: boolean("is_weekend"), // true for weekends, false for weekdays, null for all
    startDate: date("start_date"), // null for no start date
    endDate: date("end_date"), // null for no end date
    priority: integer("priority").notNull().default(0), // higher number = higher priority
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("config_id_idx").on(table.configId),
    index("day_of_week_idx").on(table.dayOfWeek),
  ],
);

// Teesheets table
export const teesheets = createTable(
  "teesheets",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    date: date("date").notNull(),
    configId: integer("config_id")
      .references(() => teesheetConfigs.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [unique("date_unq").on(table.date)],
);

// Time blocks
export const timeBlocks = createTable(
  "time_blocks",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
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
    index("teesheet_id_idx").on(table.teesheetId),
    index("start_time_idx").on(table.startTime),
  ],
);

// Time block members (join table)
export const timeBlockMembers = createTable(
  "time_block_members",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
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
    index("time_block_id_idx").on(table.timeBlockId),
    index("member_id_idx").on(table.memberId),
    unique("time_block_member_unq").on(table.timeBlockId, table.memberId),
  ],
);
