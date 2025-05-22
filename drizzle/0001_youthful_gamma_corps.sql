-- Add this part manually:
ALTER TABLE "golfsync_timeblock_restrictions"
ALTER COLUMN "member_classes" TYPE character varying(50)[]
USING "member_classes"::character varying(50)[];
