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

// Define relations for members
export const membersRelations = relations(members, ({ many }) => ({
  timeBlockMembers: many(timeBlockMembers),
}));

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
    date: date("date").notNull(),
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
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    notes: text("notes"),
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

// Define relations for teesheets
export const teesheetsRelations = relations(teesheets, ({ many, one }) => ({
  timeBlocks: many(timeBlocks),
  config: one(teesheetConfigs, {
    fields: [teesheets.configId],
    references: [teesheetConfigs.id],
  }),
}));

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
    bookingDate: date("booking_date").notNull(),
    bookingTime: varchar("booking_time", { length: 5 }).notNull(),
    checkedIn: boolean("checked_in").default(false),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    bagNumber: varchar("bag_number", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("block_members_org_id_idx").on(table.clerkOrgId),
    index("block_members_time_block_id_idx").on(table.timeBlockId),
    index("block_members_member_id_idx").on(table.memberId),
    index("block_members_booking_date_idx").on(table.bookingDate),
    index("block_members_booking_datetime_idx").on(
      table.bookingDate,
      table.bookingTime,
    ),
    index("block_members_member_date_idx").on(
      table.memberId,
      table.bookingDate,
    ),
    index("block_members_created_at_idx").on(table.createdAt),
    index("block_members_member_created_idx").on(
      table.memberId,
      table.createdAt,
    ),
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
    bookingDate: date("booking_date").notNull(),
    bookingTime: varchar("booking_time", { length: 5 }).notNull(),
    checkedIn: boolean("checked_in").default(false),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("block_guests_org_id_idx").on(table.clerkOrgId),
    index("block_guests_time_block_id_idx").on(table.timeBlockId),
    index("block_guests_guest_id_idx").on(table.guestId),
    index("block_guests_booking_date_idx").on(table.bookingDate),
    index("block_guests_booking_datetime_idx").on(
      table.bookingDate,
      table.bookingTime,
    ),
    index("block_guests_created_at_idx").on(table.createdAt),
    index("block_guests_guest_created_idx").on(table.guestId, table.createdAt),
    unique("block_guests_time_block_guest_unq").on(
      table.timeBlockId,
      table.guestId,
    ),
  ],
);

// Define relations for timeBlockMembers
export const timeBlockMembersRelations = relations(
  timeBlockMembers,
  ({ one }) => ({
    timeBlock: one(timeBlocks, {
      fields: [timeBlockMembers.timeBlockId],
      references: [timeBlocks.id],
    }),
    member: one(members, {
      fields: [timeBlockMembers.memberId],
      references: [members.id],
    }),
  }),
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

// Update timeBlocks relations to include timeBlockMembers and timeBlockGuests
export const timeBlocksRelations = relations(timeBlocks, ({ many, one }) => ({
  timeBlockMembers: many(timeBlockMembers),
  timeBlockGuests: many(timeBlockGuests),
  teesheet: one(teesheets, {
    fields: [timeBlocks.teesheetId],
    references: [teesheets.id],
  }),
}));

// Course Info table
export const courseInfo = createTable(
  "course_info",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    weatherStatus: varchar("weather_status", { length: 30 }), // Fair, Light Rain, etc.
    forecast: varchar("forecast", { length: 50 }), // e.g. "11°C"
    rainfall: varchar("rainfall", { length: 50 }), // e.g. "24 Hour Rainfall Total: 5mm"
    notes: text("notes"),
    lastUpdatedBy: varchar("last_updated_by", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    unique("course_info_org_id_unq").on(table.clerkOrgId),
    index("course_info_org_id_idx").on(table.clerkOrgId),
  ],
);

// Timeblock restrictions table - combines member class, guest restrictions, and course availability
export const timeblockRestrictions = createTable(
  "timeblock_restrictions",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Restriction Category
    restrictionCategory: varchar("restriction_category", {
      length: 20,
    }).notNull(), // 'MEMBER_CLASS', 'GUEST', 'COURSE_AVAILABILITY'

    // Restriction Type
    restrictionType: varchar("restriction_type", { length: 15 }).notNull(), // 'TIME', 'FREQUENCY', 'AVAILABILITY'

    // Entity being restricted (for member class restrictions)
    memberClass: varchar("member_class", { length: 50 }),

    // Time restriction
    startTime: varchar("start_time", { length: 5 }),
    endTime: varchar("end_time", { length: 5 }),
    daysOfWeek: integer("days_of_week").array(),

    // Date range
    startDate: date("start_date"),
    endDate: date("end_date"),

    // Frequency restriction
    maxCount: integer("max_count"),
    periodDays: integer("period_days"),
    applyCharge: boolean("apply_charge"),
    chargeAmount: real("charge_amount"),

    // Status and override
    isActive: boolean("is_active").notNull().default(true),
    canOverride: boolean("can_override").notNull().default(true),
    priority: integer("priority").notNull().default(0),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    lastUpdatedBy: varchar("last_updated_by", { length: 100 }),
  },
  (table) => [
    index("timeblock_restrictions_org_id_idx").on(table.clerkOrgId),
    index("timeblock_restrictions_category_idx").on(table.restrictionCategory),
    index("timeblock_restrictions_type_idx").on(table.restrictionType),
    index("timeblock_restrictions_member_class_idx").on(table.memberClass),
  ],
);

// Timeblock restriction overrides
export const timeblockOverrides = createTable(
  "timeblock_overrides",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    clerkOrgId: varchar("clerk_org_id", { length: 50 }).notNull(),
    restrictionId: integer("restriction_id").references(
      () => timeblockRestrictions.id,
    ),
    timeBlockId: integer("time_block_id").references(() => timeBlocks.id),
    memberId: integer("member_id").references(() => members.id),
    guestId: integer("guest_id").references(() => guests.id),
    overriddenBy: varchar("overridden_by", { length: 100 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("timeblock_overrides_org_id_idx").on(table.clerkOrgId),
    index("timeblock_overrides_restriction_id_idx").on(table.restrictionId),
    index("timeblock_overrides_time_block_id_idx").on(table.timeBlockId),
  ],
);

// Define relations for timeblock restrictions
export const timeblockRestrictionsRelations = relations(
  timeblockRestrictions,
  ({ many }) => ({
    overrides: many(timeblockOverrides),
  }),
);

export const timeblockOverridesRelations = relations(
  timeblockOverrides,
  ({ one }) => ({
    restriction: one(timeblockRestrictions, {
      fields: [timeblockOverrides.restrictionId],
      references: [timeblockRestrictions.id],
    }),
    timeBlock: one(timeBlocks, {
      fields: [timeblockOverrides.timeBlockId],
      references: [timeBlocks.id],
    }),
    member: one(members, {
      fields: [timeblockOverrides.memberId],
      references: [members.id],
    }),
    guest: one(guests, {
      fields: [timeblockOverrides.guestId],
      references: [guests.id],
    }),
  }),
);
