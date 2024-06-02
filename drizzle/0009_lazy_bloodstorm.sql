ALTER TABLE "users" ADD COLUMN "notificationsound" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "notificationSound";