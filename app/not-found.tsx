import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <p className="text-5xl">🍽️</p>
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        This page doesn&apos;t exist — but the food does.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
      >
        Browse restaurants
      </Link>
    </main>
  );
}
