import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    oauthProvider: text("oauth_provider").notNull(),
    oauthId: text("oauth_id").notNull(),
    vaultKeyEnvelope: jsonb("vault_key_envelope"),
    cryptoVersion: integer("crypto_version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_oauth_provider_oauth_id_unique").on(
      table.oauthProvider,
      table.oauthId,
    ),
  ],
);
