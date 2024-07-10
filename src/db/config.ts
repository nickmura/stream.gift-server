import { defineConfig } from "drizzle-kit";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Client } from "pg";
import 'dotenv'

export default defineConfig({
  dialect: "postgresql", // "mysql" | "sqlite" | "postgresql"
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});

  
export async function connectDatabase() {
    const client = new Client({
      connectionString: process.env.DB_URL,
    });
    await client.connect();
    let db = drizzle(client, { schema });
    return db
}