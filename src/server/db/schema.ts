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
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `golfsync_${name}`);

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
