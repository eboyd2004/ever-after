import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only", () => ({}));
vi.mock("../src/server/actions/settings/wedding-section.actions", () => ({
  createWeddingSection: vi.fn(),
  deleteWeddingSection: vi.fn(),
  reorderWeddingSections: vi.fn(),
  setWeddingSectionActive: vi.fn(),
  updateWeddingSection: vi.fn(),
}));

import { WeddingSectionsManager } from "../src/components/settings/wedding-sections-manager";

const sections = [
  {
    id: "section_1",
    name: "Ceremony",
    description: "The ceremony",
    position: 0,
    active: true,
  },
  {
    id: "section_2",
    name: "Venue",
    description: null,
    position: 1,
    active: false,
  },
];

describe("WeddingSectionsManager", () => {
  it("shows sections but hides mutation controls for VIEWER users", () => {
    const markup = renderToStaticMarkup(
      <WeddingSectionsManager initialSections={sections} readOnly />,
    );

    expect(markup).toContain("Ceremony");
    expect(markup).toContain("Venue");
    expect(markup).toContain("Read only");
    expect(markup).not.toContain("Add a section");
    expect(markup).not.toContain("Add section");
    expect(markup).not.toContain("Deactivate");
    expect(markup).not.toContain("Delete");
    expect(markup).not.toContain("Move Ceremony up");
  });

  it("renders mutation controls for editable users", () => {
    const markup = renderToStaticMarkup(
      <WeddingSectionsManager initialSections={sections} />,
    );

    expect(markup).toContain("Add a section");
    expect(markup).toContain("Add section");
    expect(markup).toContain("Deactivate");
    expect(markup).toContain("Delete");
    expect(markup).toContain("Move Ceremony up");
  });

  it("offers legacy default initialization only to editable users", () => {
    const viewerMarkup = renderToStaticMarkup(
      <WeddingSectionsManager initialSections={[]} readOnly />,
    );
    const editorMarkup = renderToStaticMarkup(
      <WeddingSectionsManager initialSections={[]} />,
    );

    expect(viewerMarkup).toContain("No sections yet");
    expect(viewerMarkup).not.toContain("Initialize default sections");
    expect(editorMarkup).toContain("Initialize default sections");
  });
});
