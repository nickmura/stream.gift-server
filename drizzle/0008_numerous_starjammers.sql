ALTER TABLE "users" ALTER COLUMN "notificationSound" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "streamer_name" text;