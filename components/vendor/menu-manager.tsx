"use client";

import { useRef, useState, useTransition } from "react";
import type { MenuItem, MenuItemStatus, RestaurantWithMenu } from "@/types";
import { formatPrice } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  createCategory,
  createMenuItem,
  deleteMenuItem,
  setItemAvailability,
  updateMenuItem,
} from "@/app/actions/vendor";

const STATUS_BADGE: Record<MenuItemStatus, [string, string]> = {
  approved: ["● Live", "bg-emerald-100 text-emerald-800"],
  pending: ["Pending review", "bg-amber-100 text-amber-800"],
  rejected: ["Rejected", "bg-red-100 text-red-800"],
};

function StatusBadge({ status }: { status: MenuItemStatus }) {
  const [label, cls] = STATUS_BADGE[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

/** Uploads to the menu-images bucket and returns the public URL. */
function ImagePicker({
  restaurantId,
  value,
  onChange,
  onError,
}: {
  restaurantId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (msg: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onError(null);
    if (!file.type.startsWith("image/")) {
      onError("Please choose an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      onError("Image must be under 3 MB");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (error) {
      onError(error.message);
      return;
    }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Item"
          className="h-16 w-16 rounded-lg object-cover ring-1 ring-stone-200"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-stone-100 text-xl text-stone-300">
          🍽️
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function MenuManager({ restaurant }: { restaurant: RestaurantWithMenu }) {
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [pending, startTransition] = useTransition();

  function addCategory() {
    startTransition(async () => {
      const r = await createCategory(restaurant.id, newCategory);
      if (r.error) setError(r.error);
      else setNewCategory("");
    });
  }

  return (
    <div>
      <div className="mb-5 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
        📋 New items and any edits (including photos) are reviewed by Sufra
        before customers see them. They show as <b>Pending review</b> until
        approved. Removing an item or marking it out of stock is instant.
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {restaurant.menu_categories.map((cat) => (
        <section key={cat.id} className="mt-6 first:mt-0">
          <h2 className="text-lg font-bold text-neutral-900">{cat.name}</h2>
          <div className="mt-3 space-y-2">
            {cat.menu_items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                restaurantId={restaurant.id}
                onError={setError}
              />
            ))}
            <AddItemForm
              restaurantId={restaurant.id}
              categoryId={cat.id}
              onError={setError}
            />
          </div>
        </section>
      ))}

      <section className="mt-8 rounded-xl border border-dashed border-neutral-300 p-4">
        <h3 className="text-sm font-semibold text-neutral-700">
          Add a category
        </h3>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Desserts"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={addCategory}
            disabled={pending || !newCategory.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>
    </div>
  );
}

function MenuItemRow({
  item,
  restaurantId,
  onError,
}: {
  item: MenuItem;
  restaurantId: string;
  onError: (e: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [imageUrl, setImageUrl] = useState<string | null>(item.image_url);
  const [pending, startTransition] = useTransition();

  function save() {
    onError(null);
    startTransition(async () => {
      const r = await updateMenuItem(item.id, {
        name,
        description,
        price: Number(price),
        image_url: imageUrl,
      });
      if (r.error) onError(r.error);
      else setEditing(false);
    });
  }

  function toggleAvailability() {
    onError(null);
    startTransition(async () => {
      const r = await setItemAvailability(item.id, !item.is_available);
      if (r.error) onError(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    onError(null);
    startTransition(async () => {
      const r = await deleteMenuItem(item.id);
      if (r.error) onError(r.error);
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-300">
        <ImagePicker
          restaurantId={restaurantId}
          value={imageUrl}
          onChange={setImageUrl}
          onError={onError}
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Item name"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min="1"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Price"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Description (optional)"
        />
        <p className="mt-2 text-xs text-amber-700">
          Saving sends this item for review before it goes live again.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Save for review
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 ${
        item.is_available ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-lg text-stone-300">
              🍽️
            </div>
          )}
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-neutral-900">
              {item.name}
              <StatusBadge status={item.status} />
              <span className="font-normal text-neutral-500">
                · {formatPrice(item.price)}
              </span>
            </p>
            {item.description && (
              <p className="truncate text-sm text-neutral-500">
                {item.description}
              </p>
            )}
            {item.status === "rejected" && item.rejection_reason && (
              <p className="mt-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs text-red-700">
                Rejected: {item.rejection_reason} — edit and save to resubmit.
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleAvailability}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              item.is_available
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
          >
            {item.is_available ? "In stock" : "Out of stock"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Edit
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemForm({
  restaurantId,
  categoryId,
  onError,
}: {
  restaurantId: string;
  categoryId: string;
  onError: (e: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        + Add item
      </button>
    );
  }

  function add() {
    onError(null);
    startTransition(async () => {
      const r = await createMenuItem(restaurantId, categoryId, {
        name,
        description,
        price: Number(price),
        image_url: imageUrl,
      });
      if (r.error) onError(r.error);
      else {
        setName("");
        setDescription("");
        setPrice("");
        setImageUrl(null);
        setOpen(false);
      }
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
      <ImagePicker
        restaurantId={restaurantId}
        value={imageUrl}
        onChange={setImageUrl}
        onError={onError}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min="1"
          placeholder="Price (Rs)"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <p className="mt-2 text-xs text-amber-700">
        New items are reviewed by Sufra before customers can see them.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={add}
          disabled={pending || !name.trim() || !price}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit for review"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
