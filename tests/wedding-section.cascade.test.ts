import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("WeddingSection deletion cascade", () => {
  it("keeps the existing wedding foreign key cascade for sections", () => {
    const migration = readFileSync(
      new URL(
        "../prisma/migrations/20260806153904_initial_schema/migration.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(migration).toContain(
      'ALTER TABLE "wedding_sections" ADD CONSTRAINT "wedding_sections_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE',
    );
  });
});
