import { sql } from "drizzle-orm";
import { serial, text, timestamp, pgTable, decimal, boolean } from "drizzle-orm/pg-core";

export const donations = pgTable("donations", {
  id: serial("id"),
  digest: text("digest"),
  sender: text("sender"),
  sender_suins: text('sender_suins'),
  recipient: text("recipient"),
  amount: decimal("amount"),
  message: text("message"),
  completed: boolean('completed').default(sql`false`),
  streamer_name: text('streamer_name')
});

export const users = pgTable("users", {
  id: serial("id"),
  preferred_username: text("preferred_username"),
  nonce: text("nonce"),
  streamer_address: text("streamer_address"),
  suins: text("suins"),
  secret: text("secret"),
  textToSpeech: boolean("textToSpeech").default(false),
  notificationSound: boolean("notificationSound").default(true),
  signature: text("signature")
})