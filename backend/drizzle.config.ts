/// <reference types="node" />

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_MIGRATION_URL) {
  throw new Error("DATABASE_MIGRATION_URL is not defined in the environment variables");
}

export default defineConfig({
  schema: "./src/model/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL,
  },
});