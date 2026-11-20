CREATE TABLE "home_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"sub_label" text DEFAULT '' NOT NULL,
	"icon_url" text,
	"kind" text NOT NULL,
	"href" text,
	"show_mobile" boolean DEFAULT true NOT NULL,
	"show_tablet" boolean DEFAULT true NOT NULL,
	"show_desktop" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "home_actions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "home_footer_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" text NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "street_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"place_id" uuid,
	"scene_template_id" uuid NOT NULL,
	"image_x" real DEFAULT 0 NOT NULL,
	"image_y" real DEFAULT 0 NOT NULL,
	"image_w" real DEFAULT 10 NOT NULL,
	"image_h" real DEFAULT 10 NOT NULL,
	"pos_x" real DEFAULT 0 NOT NULL,
	"pos_z" real DEFAULT 0 NOT NULL,
	"rotation_deg" real DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scene_templates" ADD COLUMN "glb_url" text;--> statement-breakpoint
ALTER TABLE "scene_templates" ADD COLUMN "glb_lod1_url" text;--> statement-breakpoint
ALTER TABLE "scene_templates" ADD COLUMN "glb_lod2_url" text;--> statement-breakpoint
ALTER TABLE "scene_templates" ADD COLUMN "model_scale" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "street_slots" ADD CONSTRAINT "street_slots_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "street_slots" ADD CONSTRAINT "street_slots_scene_template_id_scene_templates_id_fk" FOREIGN KEY ("scene_template_id") REFERENCES "public"."scene_templates"("id") ON DELETE no action ON UPDATE no action;