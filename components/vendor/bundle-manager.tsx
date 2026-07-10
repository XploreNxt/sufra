"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/types";
import type { Bundle } from "@/types";
import { createBundle, deleteBundle, setBundleActive } from "@/app/actions/bundles";

interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

const input =
  "w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500";

export function BundleManager({
  restaurantId,
  bundles,
  menuItems,
}: {
  restaurantId: string;
  bundles: Bundle[];
  menuItems: MenuItemOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState<Array<{ menu_item_id: string; quantity: number }>>([
    { menu_item_id: "", quantity: 1 },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl(null);
    setRows([{ menu_item_id: "", quantity: 1 }]);
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return setError("Choose an image file");
    if (file.size > 4 * 1024 * 1024) return setError("Image must be under 4 MB");
    setError(null);
    setUploading(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `bundles/${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (e) return setError(e.message);
    setImageUrl(
      supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl
    );
  }

  function create() {
    setError(null);
    start(async () => {
      const r = await createBundle(restaurantId, {
        name,
        description,
        image_url: imageUrl,
        price: Number(price),
        items: rows,
      });
      if (r.error) setError(r.error);
      else {
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  function toggle(b: Bundle) {
    start(async () => {
      const r = await setBundleActive(b.id, !b.is_active);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function remove(b: Bundle) {
    if (!window.confirm(`Delete "${b.name}"?`)) return;
    start(async () => {
      const r = await deleteBundle(b.id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <section className="mb-8 rounded-2xl bg-amber-50/50 p-5 ring-1 ring-amber-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">🎁 Offers &amp; bundles</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            + New bundle
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Combine menu items into a deal at one price. Bundles show at the top of
        your page and go live instantly.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {open && (
        <div className="s-scale-in mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bundle name (e.g. Family Feast)"
              className={input}
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="1"
              placeholder="Price (Rs)"
              className={input}
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={`mt-2 ${input}`}
          />

          <p className="mt-4 text-xs font-semibold text-stone-600">Items in this bundle</p>
          <div className="mt-1.5 space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={row.menu_item_id}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], menu_item_id: e.target.value };
                    setRows(next);
                  }}
                  className={`${input} bg-white`}
                >
                  <option value="">Choose item…</option>
                  {menuItems.map((mi) => (
                    <option key={mi.id} value={mi.id}>
                      {mi.name} ({formatPrice(mi.price)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], quantity: Number(e.target.value) };
                    setRows(next);
                  }}
                  className="w-20 rounded-xl border border-stone-300 px-3 py-2 text-sm"
                />
                {rows.length > 1 && (
                  <button
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="px-2 text-sm text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setRows([...rows, { menu_item_id: "", quantity: 1 }])}
            className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
          >
            + Add another item
          </button>

          <div className="mt-4 flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : imageUrl ? "✓ Photo added" : "Add photo (optional)"}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={create}
              disabled={pending || !name.trim() || !price}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create bundle"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="rounded-xl px-4 py-2.5 text-sm text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {bundles.length > 0 && (
        <div className="mt-4 space-y-2">
          {bundles.map((b) => (
            <div
              key={b.id}
              className={`flex items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200 ${
                b.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">
                  {b.name}{" "}
                  <span className="font-normal text-stone-500">
                    · {formatPrice(b.price)}
                  </span>
                </p>
                <p className="truncate text-xs text-stone-500">
                  {b.bundle_items
                    .map((bi) => `${bi.quantity}× ${bi.menu_items?.name ?? "item"}`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggle(b)}
                  disabled={pending}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    b.is_active
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                  }`}
                >
                  {b.is_active ? "Live" : "Hidden"}
                </button>
                <button
                  onClick={() => remove(b)}
                  disabled={pending}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
