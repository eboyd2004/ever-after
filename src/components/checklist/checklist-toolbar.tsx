import { Icon } from "../shared/icons";
import { Badge, Input, Select } from "../shared/ui";

type ChecklistToolbarProps = {
  categoryNames: string[];
  priorities: string[];
  totalCount: number;
  incompleteCount: number;
  completedCount: number;
};

export function ChecklistToolbar({
  categoryNames,
  priorities,
  totalCount,
  incompleteCount,
  completedCount,
}: ChecklistToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <label className="relative w-full sm:w-[260px]">
        <span className="sr-only">Search tasks</span>
        <Input
          aria-disabled="true"
          className="w-full pl-9"
          placeholder="Search tasks…"
          readOnly
        />
        <span className="pointer-events-none absolute left-3 top-3 text-[#8A8A82]">
          <Icon name="search" size={14} />
        </span>
      </label>

      <Select aria-disabled="true" defaultValue="all" disabled>
        <option value="all">All categories</option>
        {categoryNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </Select>

      <Select aria-disabled="true" defaultValue="all" disabled>
        <option value="all">All priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>

      <div className="ml-0 flex w-full items-center gap-0.5 rounded-[10px] bg-[#F4F4F1] p-1 sm:ml-auto sm:w-auto">
        <Tab label="All" count={totalCount} active />
        <Tab label="To Do" count={incompleteCount} />
        <Tab label="Done" count={completedCount} />
      </div>

      <p className="sr-only">
        Search, category filters, priority filters, and task tabs are unavailable in the
        private alpha.
      </p>
    </div>
  );
}

function Tab({
  label,
  count,
  active = false,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      aria-disabled="true"
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium ${active ? "bg-white text-[#1C1C1C] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#8A8A82]"}`}
      disabled
      type="button"
    >
      {label}
      <Badge tone={active ? "success" : "default"}>{count}</Badge>
    </button>
  );
}
