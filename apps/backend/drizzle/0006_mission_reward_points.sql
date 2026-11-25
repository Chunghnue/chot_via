ALTER TABLE "point_ledger" ALTER COLUMN "wish_event_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "reward_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD COLUMN "mission_id" uuid;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD COLUMN "period_key" text;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "point_ledger_mission_unique" ON "point_ledger" USING btree ("user_id","mission_id","period_key");