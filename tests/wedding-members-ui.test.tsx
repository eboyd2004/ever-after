import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WeddingMembersList } from "../src/components/settings/wedding-members-list";

describe("WeddingMembersList", () => {
  it("renders current members and their roles", () => {
    const markup = renderToStaticMarkup(
      <WeddingMembersList
        members={[
          {
            id: "membership_1",
            userId: "user_1",
            email: "owner@example.com",
            firstName: "Owner",
            lastName: "Example",
            profileImageUrl: null,
            role: "OWNER",
            joinedAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(markup).toContain("Owner Example");
    expect(markup).toContain("owner@example.com");
    expect(markup).toContain("OWNER");
  });
});
