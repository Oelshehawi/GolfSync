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
  text,
  real,
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

// Guests table
export const guests = createTable(
  "guests",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    handicap: varchar("handicap", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("guests_org_id_idx").on(table.clerkOrgId),
    index("guests_name_idx").on(table.firstName, table.lastName),
  ],
);

// Time block guests (join table)
export const timeBlockGuests = createTable(
  "time_block_guests",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    timeBlockId: integer("time_block_id")
      .references(() => timeBlocks.id, { onDelete: "cascade" })
      .notNull(),
    guestId: integer("guest_id")
      .references(() => guests.id, { onDelete: "cascade" })
      .notNull(),
    invitedByMemberId: integer("invited_by_member_id")
      .references(() => members.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("block_guests_org_id_idx").on(table.clerkOrgId),
    index("block_guests_time_block_id_idx").on(table.timeBlockId),
    index("block_guests_guest_id_idx").on(table.guestId),
    unique("block_guests_time_block_guest_unq").on(
      table.timeBlockId,
      table.guestId,
    ),
  ],
);

// Define relations for guests and timeBlockGuests
export const guestsRelations = relations(guests, ({ many }) => ({
  timeBlockGuests: many(timeBlockGuests),
}));

export const timeBlockGuestsRelations = relations(
  timeBlockGuests,
  ({ one }) => ({
    guest: one(guests, {
      fields: [timeBlockGuests.guestId],
      references: [guests.id],
    }),
    timeBlock: one(timeBlocks, {
      fields: [timeBlockGuests.timeBlockId],
      references: [timeBlocks.id],
    }),
    invitedByMember: one(members, {
      fields: [timeBlockGuests.invitedByMemberId],
      references: [members.id],
    }),
  }),
);

// Update timeBlocks relations to include guests
export const timeBlocksRelations = relations(timeBlocks, ({ many }) => ({
  members: many(timeBlockMembers),
  guests: many(timeBlockGuests),
}));

// Restrictions table for member classes and guests
export const restrictions = createTable(
  "restrictions",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 10 }).notNull(), // 'CLASS' or 'GUEST'
    entityId: varchar("entity_id", { length: 50 }), // class name for 'CLASS', null for 'GUEST'
    restrictionType: varchar("restriction_type", { length: 10 }).notNull(), // 'TIME' or 'FREQUENCY'
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),

    // Time restriction fields
    startTime: varchar("start_time", { length: 5 }), // Format: HH:MM (24h)
    endTime: varchar("end_time", { length: 5 }), // Format: HH:MM (24h)
    daysOfWeek: integer("days_of_week").array(), // [0,1,2,3,4,5,6] for Sun-Sat

    // Frequency restriction fields
    maxCount: integer("max_count"), // Maximum number of bookings allowed
    periodDays: integer("period_days"), // Period in days (30 for monthly)
    applyCharge: boolean("apply_charge"), // Whether to apply a charge after max count
    chargeAmount: real("charge_amount"), // Amount to charge

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("restrictions_org_id_idx").on(table.clerkOrgId),
    index("restrictions_entity_type_idx").on(table.entityType),
    index("restrictions_entity_id_idx").on(table.entityId),
    index("restrictions_type_idx").on(table.restrictionType),
  ],
);

// Guest booking history table for tracking frequency restrictions
export const guestBookingHistory = createTable(
  "guest_booking_history",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    guestId: integer("guest_id")
      .references(() => guests.id, { onDelete: "cascade" })
      .notNull(),
    bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),
    wasCharged: boolean("was_charged").notNull().default(false),
    chargeAmount: real("charge_amount"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("guest_booking_history_org_id_idx").on(table.clerkOrgId),
    index("guest_booking_history_guest_id_idx").on(table.guestId),
    index("guest_booking_history_booking_date_idx").on(table.bookingDate),
  ],
);

// Member booking history table for tracking frequency restrictions
export const memberBookingHistory = createTable(
  "member_booking_history",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    memberId: integer("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),
    wasCharged: boolean("was_charged").notNull().default(false),
    chargeAmount: real("charge_amount"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("member_booking_history_org_id_idx").on(table.clerkOrgId),
    index("member_booking_history_member_id_idx").on(table.memberId),
    index("member_booking_history_booking_date_idx").on(table.bookingDate),
  ],
);

// Restriction override log for auditing
export const restrictionOverrides = createTable(
  "restriction_overrides",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    restrictionId: integer("restriction_id").references(() => restrictions.id, {
      onDelete: "set null",
    }),
    overriddenBy: varchar("overridden_by", { length: 100 }).notNull(), // Admin user who overrode
    entityType: varchar("entity_type", { length: 10 }).notNull(), // 'CLASS' or 'GUEST'
    entityId: varchar("entity_id", { length: 50 }), // Member class or guest ID
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("restriction_overrides_org_id_idx").on(table.clerkOrgId),
    index("restriction_overrides_restriction_id_idx").on(table.restrictionId),
  ],
);

// Define relations for restrictions
export const restrictionsRelations = relations(restrictions, ({ many }) => ({
  overrides: many(restrictionOverrides),
}));

export const guestBookingHistoryRelations = relations(
  guestBookingHistory,
  ({ one }) => ({
    guest: one(guests, {
      fields: [guestBookingHistory.guestId],
      references: [guests.id],
    }),
  }),
);

export const memberBookingHistoryRelations = relations(
  memberBookingHistory,
  ({ one }) => ({
    member: one(members, {
      fields: [memberBookingHistory.memberId],
      references: [members.id],
    }),
  }),
);

export const restrictionOverridesRelations = relations(
  restrictionOverrides,
  ({ one }) => ({
    restriction: one(restrictions, {
      fields: [restrictionOverrides.restrictionId],
      references: [restrictions.id],
    }),
  }),
);
