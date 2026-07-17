-- Teacher-authored areas of expertise (e.g. "Rotational Mechanics"), rendered as
-- chips on teacher cards (see DESIGN.md Component Patterns). Additive and safe:
-- existing teacher_profiles rows get the default empty array.
ALTER TABLE "teacher_profiles" ADD COLUMN "expertiseTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
