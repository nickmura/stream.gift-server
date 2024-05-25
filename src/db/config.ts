import { defineConfig } from "drizzle-kit";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";


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
    const db = drizzle(client);
    return db
}