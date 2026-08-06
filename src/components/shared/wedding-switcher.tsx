"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setActiveWedding } from "@/src/server/actions/wedding/wedding.actions";
import { Icon } from "./icons";

export type WeddingSwitcherOption = {
  id: string;
  name: string;
  partnerNames: string;
};

type WeddingSwitcherProps = {
  activeWeddingId: string | null;
  compact?: boolean;
  options: WeddingSwitcherOption[];
};

export function WeddingSwitcher({
  activeWeddingId,
  compact = false,
  options,
}: WeddingSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) {
    if (compact) {
      return (
        <Link
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#2D5A27] hover:bg-[#F3F1EA]"
          href="/onboarding"
        >
          Create wedding
        </Link>
      );
    }

    return (
      <div className="mx-4 mt-4 rounded-[12px] border border-[#E4E0D4] bg-white p-3.5">
        <p className="text-xs font-semibold text-[#1C1C1C]">No wedding yet</p>
        <Link
          className="mt-2 inline-flex text-[11px] font-semibold text-[#2D5A27] hover:underline"
          href="/onboarding"
        >
          Create your wedding
        </Link>
      </div>
    );
  }

  function handleChange(weddingId: string) {
    setError(null);

    startTransition(async () => {
      const result = await setActiveWedding(weddingId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  const activeOption = options.find((option) => option.id === activeWeddingId);
  const hasMultipleWeddings = options.length > 1;

  if (compact) {
    return (
      <div className="relative min-w-0 max-w-[220px] shrink-0 sm:max-w-[260px]">
        {hasMultipleWeddings ? (
          <label className="relative block" htmlFor="active-wedding">
            <span className="sr-only">Switch active wedding</span>
            <select
              aria-label="Switch active wedding"
              className="h-10 w-full appearance-none truncate rounded-[10px] border border-[#E4E0D4] bg-[#F7F6F2] px-3.5 pr-9 text-sm font-semibold text-[#1C1C1C] outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#DDEBD9] disabled:cursor-wait disabled:opacity-60"
              disabled={isPending}
              id="active-wedding"
              onChange={(event) => handleChange(event.target.value)}
              value={activeWeddingId ?? ""}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B63]">
              <Icon name="chevron-down" size={14} />
            </span>
          </label>
        ) : (
          <div className="min-w-0 px-1">
            <p className="truncate text-sm font-semibold leading-tight text-[#1C1C1C]">
              {options[0].name}
            </p>
          </div>
        )}
        {error ? (
          <p
            aria-live="polite"
            className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-[#E7C9C5] bg-[#FFF5F3] px-2.5 py-2 text-[10px] text-[#9D3F32] shadow-sm"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 rounded-[12px] border border-[#E4E0D4] bg-gradient-to-br from-[#EAF0E8] to-[#FBF5E6] p-3.5">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A7A6E]">
          Current wedding
        </span>
        {hasMultipleWeddings ? (
          <label className="relative mt-1.5 block" htmlFor="active-wedding">
            <select
              aria-label="Switch active wedding"
              className="w-full appearance-none truncate rounded-lg border border-transparent bg-white/70 px-2.5 py-2 pr-8 text-xs font-semibold text-[#1C1C1C] outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#DDEBD9] disabled:cursor-wait disabled:opacity-60"
              disabled={isPending}
              id="active-wedding"
              onChange={(event) => handleChange(event.target.value)}
              value={activeWeddingId ?? ""}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.partnerNames}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B63]">
              <Icon name="chevron-down" size={14} />
            </span>
          </label>
        ) : (
          <div className="mt-2 px-1.5 py-1">
            <p className="truncate text-sm font-semibold leading-tight text-[#1C1C1C]">
              {options[0].name}
            </p>
            <p className="mt-1 truncate text-[11px] text-[#7A7A6E]">
              {options[0].partnerNames}
            </p>
          </div>
        )}
      </div>
      {hasMultipleWeddings ? (
        <p className="mt-1.5 truncate text-[11px] text-[#7A7A6E]">
          {activeOption?.partnerNames ?? "Select a wedding"}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-2 text-[10px] text-[#9D3F32]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
