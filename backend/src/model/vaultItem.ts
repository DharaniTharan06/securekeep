import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.js";

export const vaultItems = pgTable(
  "vault_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    encryptedPayload: jsonb("encrypted_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("vault_items_user_id_index").on(table.userId)],
);
