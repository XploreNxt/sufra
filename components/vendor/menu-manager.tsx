"use client";

import { useState, useTransition } from "react";
import type { MenuItem, RestaurantWithMenu } from "@/types";
import { formatPrice } from "@/types";
import {
  createCategory,
  createMenuItem,
  deleteMenuItem,
  setItemAvailability,
  updateMenuItem,
} from "@/app/actions/vendor";

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
              <MenuItemRow key={item.id} item={item} onError={setError} />
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
  onError,
}: {
  item: MenuItem;
  onError: (e: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [pending, startTransition] = useTransition();

  function save() {
    onError(null);
    startTransition(async () => {
      const r = await updateMenuItem(item.id, {
        name,
        description,
        price: Number(price),
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
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
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
        <div className="mt-3 flex gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Save
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
      className={`flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 ${
        item.is_available ? "" : "opacity-60"
      }`}
    >
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900">
          {item.name}{" "}
          <span className="font-normal text-neutral-500">
            · {formatPrice(item.price)}
          </span>
        </p>
        {item.description && (
          <p className="truncate text-sm text-neutral-500">{item.description}</p>
        )}
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
          {item.is_available ? "Available" : "Unavailable"}
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
      });
      if (r.error) onError(r.error);
      else {
        setName("");
        setDescription("");
        setPrice("");
        setOpen(false);
      }
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
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
      <div className="mt-3 flex gap-2">
        <button
          onClick={add}
          disabled={pending || !name.trim() || !price}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add item"}
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
