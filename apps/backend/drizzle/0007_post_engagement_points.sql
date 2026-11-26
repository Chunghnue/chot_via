ALTER TABLE "point_ledger" ADD COLUMN "source_post_id" uuid;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD COLUMN "source_actor_id" uuid;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_source_post_id_posts_id_fk" FOREIGN KEY ("source_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_source_actor_id_users_id_fk" FOREIGN KEY ("source_actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "point_ledger_engagement_unique" ON "point_ledger" USING btree ("source_post_id","source_actor_id");