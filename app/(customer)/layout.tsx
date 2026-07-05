import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartHeaderLink } from "@/components/cart-header-link";
import { SufraLogo } from "@/components/brand";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <header className="s-glass sticky top-0 z-20 border-b border-stone-200/70">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
            <SufraLogo />
            <div className="flex items-center gap-2">
              {profile && (
                <Link
                  href="/orders"
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-900/5"
                >
                  Orders
                </Link>
              )}
              <CartHeaderLink />
              {profile ? (
                <LogoutButton />
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md active:scale-95"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </div>
        <footer className="border-t border-stone-200/70 py-6 text-center text-xs text-stone-400">
          Sufra — dastarkhwan, delivered. 🇵🇰
        </footer>
      </div>
    </CartProvider>
  );
}
