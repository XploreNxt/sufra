"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        It might be a patchy connection. Your cart is safe — try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
      >
        Try again
      </button>
    </main>
  );
}
