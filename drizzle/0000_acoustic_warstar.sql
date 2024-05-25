CREATE TABLE IF NOT EXISTS "donations" (
	"id" serial NOT NULL,
	"digest" text,
	"sender" text,
	"recipient" text,
	"amount" numeric,
	"message" text
);
