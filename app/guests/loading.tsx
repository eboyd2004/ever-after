export default function GuestsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-3 w-44 rounded bg-[#E4E0D4]" />
      <div className="h-9 w-64 rounded bg-[#E4E0D4]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div className="h-28 rounded-[14px] bg-[#E4E0D4]" key={item} />)}
      </div>
      <div className="h-16 rounded-[14px] bg-[#E4E0D4]" />
      <div className="h-96 rounded-[14px] bg-[#E4E0D4]" />
    </div>
  );
}
