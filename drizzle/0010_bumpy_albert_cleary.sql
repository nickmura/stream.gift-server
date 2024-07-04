ALTER TABLE "donations" ADD COLUMN "sender_tns" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "evm_streamer_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tns" text;