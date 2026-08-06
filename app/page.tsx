import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-5 py-12">
      <section className="w-full max-w-2xl rounded-[20px] border border-[#E4E0D4] bg-white p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2D5A27] to-[#C4973A] text-white">
          <span aria-hidden="true" className="text-xl">✦</span>
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D5A27]">
          Ever After
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-[-0.03em] text-[#1C1C1C] sm:text-5xl">
          Plan your day beautifully.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#7A7A6E]">
          Bring every thoughtful detail of your wedding into one calm, shared workspace.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="rounded-[10px] bg-[#2D5A27] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#245020]"
            href="/sign-up"
          >
            Create your workspace
          </Link>
          <Link
            className="rounded-[10px] border border-[#E4E0D4] bg-[#F4F4F1] px-5 py-2.5 text-sm font-medium text-[#1C1C1C] transition hover:bg-[#EAEAE7]"
            href="/sign-in"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
