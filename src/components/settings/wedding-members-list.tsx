import type { WeddingMemberListItem } from "@/src/server/actions/wedding/wedding.actions";

export function WeddingMembersList({
  members,
}: {
  members: WeddingMemberListItem[];
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-[#D9D6C9] px-4 py-5 text-sm text-[#7A7A6E]">
        No active members were found for this wedding.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#EEECE4] rounded-[12px] border border-[#E4E0D4]">
      {members.map((member) => {
        const name = `${member.firstName} ${member.lastName}`.trim();

        return (
          <li
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            key={member.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0E8] text-xs font-semibold text-[#2D5A27]">
                {getInitials(member.firstName, member.lastName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1C1C1C]">
                  {name || member.email}
                </p>
                <p className="truncate text-xs text-[#7A7A6E]">{member.email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-[#7A7A6E]">
              <span className="rounded-full bg-[#F4F4F1] px-2.5 py-1 font-semibold uppercase tracking-[0.08em] text-[#5D6057]">
                {member.role}
              </span>
              {member.joinedAt ? <span>Joined {formatDate(member.joinedAt)}</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}
