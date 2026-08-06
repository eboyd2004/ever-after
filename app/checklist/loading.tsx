export default function ChecklistLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-3 w-48 rounded bg-[#E4E0D4]" />
      <div className="h-9 w-64 rounded bg-[#E4E0D4]" />
      <div className="h-4 w-96 max-w-full rounded bg-[#E4E0D4]" />
      <div className="h-32 rounded-[14px] bg-[#E4E0D4]" />
      <div className="grid gap-4">
        <div className="h-52 rounded-[14px] bg-[#E4E0D4]" />
        <div className="h-52 rounded-[14px] bg-[#E4E0D4]" />
      </div>
    </div>
  );
}
