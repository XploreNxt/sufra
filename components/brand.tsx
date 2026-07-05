import Link from "next/link";

/** Sufra wordmark: plate mark + gradient type. */
export function SufraLogo({
  suffix,
  href = "/",
}: {
  suffix?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-base shadow-sm ring-1 ring-emerald-900/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        🍽️
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        <span className="s-gradient-text">Sufra</span>
        {suffix && (
          <span className="ml-1.5 align-middle rounded-md bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {suffix}
          </span>
        )}
      </span>
    </Link>
  );
}
