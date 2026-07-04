// Seeds test restaurants + menus, owned by vendor@test.com.
// Idempotent: skips restaurants that already exist by name.
// Run with: node scripts/seed-restaurants.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Karachi-ish coordinates for the MVP city.
const RESTAURANTS = [
  {
    name: "Karachi Biryani House",
    description: "Authentic degi biryani, made fresh every day.",
    cuisine_types: ["Biryani", "Desi"],
    address_text: "Shop 12, Tariq Road, Karachi",
    lat: 24.8778, lng: 67.0631,
    phone: "+922134567801",
    commission_rate: 15, min_order: 300, delivery_fee: 99,
    default_prep_minutes: 25, status: "active", is_open: true, rating_avg: 4.5,
    menu: {
      Biryani: [
        { name: "Chicken Biryani", description: "Single plate with aloo, degi masala", price: 350,
          modifiers: [
            { name: "Spice Level", min: 1, max: 1, required: true,
              options: [["Mild", 0], ["Medium", 0], ["Extra Spicy", 0]] },
            { name: "Add-ons", min: 0, max: 3, required: false,
              options: [["Boiled Egg", 30], ["Extra Raita", 40], ["Extra Aloo", 30]] },
          ] },
        { name: "Beef Biryani", description: "Tender beef, basmati rice", price: 450, modifiers: [] },
        { name: "Mutton Biryani", description: "Weekend special", price: 550, modifiers: [] },
      ],
      Extras: [
        { name: "Raita", price: 50, modifiers: [] },
        { name: "Fresh Salad", price: 50, modifiers: [] },
        { name: "Shami Kabab", price: 80, modifiers: [] },
      ],
      Drinks: [
        { name: "Soft Drink (Can)", price: 120, modifiers: [] },
        { name: "Mineral Water", price: 60, modifiers: [] },
      ],
    },
  },
  {
    name: "Lahori Chargha & Grill",
    description: "Charcoal-grilled chargha, BBQ and fresh naan.",
    cuisine_types: ["BBQ", "Desi"],
    address_text: "Main Boulevard, Gulshan-e-Iqbal, Karachi",
    lat: 24.9180, lng: 67.0971,
    phone: "+922134567802",
    commission_rate: 15, min_order: 500, delivery_fee: 149,
    default_prep_minutes: 40, status: "active", is_open: false, rating_avg: 4.2,
    menu: {
      BBQ: [
        { name: "Chicken Chargha (Full)", description: "Steam-roasted then flash fried", price: 1400, modifiers: [] },
        { name: "Chicken Chargha (Half)", price: 750, modifiers: [] },
        { name: "Malai Boti (8 pcs)", price: 450, modifiers: [] },
        { name: "Seekh Kabab (4 pcs)", price: 400, modifiers: [] },
      ],
      Breads: [
        { name: "Naan", price: 30, modifiers: [] },
        { name: "Roghni Naan", price: 50, modifiers: [] },
      ],
      Drinks: [
        { name: "Soft Drink (1L)", price: 250, modifiers: [] },
        { name: "Mint Margarita", price: 200, modifiers: [] },
      ],
    },
  },
  {
    name: "Cheezy Bites",
    description: "Smash burgers, loaded fries and student deals.",
    cuisine_types: ["Fast Food", "Burgers"],
    address_text: "Block 2, PECHS, Karachi",
    lat: 24.8700, lng: 67.0550,
    phone: "+922134567803",
    commission_rate: 18, min_order: 250, delivery_fee: 79,
    default_prep_minutes: 20, status: "active", is_open: true, rating_avg: null,
    menu: {
      Burgers: [
        { name: "Zinger Burger", description: "Crispy fillet, house sauce", price: 420,
          modifiers: [
            { name: "Extras", min: 0, max: 2, required: false,
              options: [["Extra Cheese", 50], ["Make it a Combo (fries + drink)", 250]] },
          ] },
        { name: "Beef Smash Burger", description: "Double patty, cheddar", price: 550, modifiers: [] },
        { name: "Chicken Patty Burger", price: 350, modifiers: [] },
      ],
      "Fries & Sides": [
        { name: "Regular Fries", price: 200, modifiers: [] },
        { name: "Loaded Fries", description: "Cheese sauce, jalapeños", price: 350, modifiers: [] },
        { name: "Nuggets (6 pcs)", price: 300, modifiers: [] },
      ],
      Deals: [
        { name: "Family Deal", description: "2 zingers, 2 patty burgers, fries, 1L drink", price: 1500, modifiers: [] },
      ],
    },
  },
];

// Owner: the seeded vendor account.
const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) throw listErr;
const vendor = list.users.find((u) => u.email === "vendor@test.com");
if (!vendor) throw new Error("vendor@test.com not found — run seed-users.mjs first");

for (const r of RESTAURANTS) {
  const { data: existing } = await admin
    .from("restaurants").select("id").eq("name", r.name).maybeSingle();
  if (existing) {
    console.log(`= ${r.name} already exists`);
    continue;
  }

  const { menu, ...fields } = r;
  const { data: rest, error } = await admin
    .from("restaurants")
    .insert({ ...fields, owner_user_id: vendor.id })
    .select("id").single();
  if (error) { console.error(`x ${r.name}: ${error.message}`); continue; }
  console.log(`+ ${r.name}`);

  let catSort = 0;
  for (const [catName, items] of Object.entries(menu)) {
    const { data: cat, error: catErr } = await admin
      .from("menu_categories")
      .insert({ restaurant_id: rest.id, name: catName, sort_order: catSort++ })
      .select("id").single();
    if (catErr) { console.error(`  x ${catName}: ${catErr.message}`); continue; }

    let itemSort = 0;
    for (const item of items) {
      const { data: mi, error: miErr } = await admin
        .from("menu_items")
        .insert({
          restaurant_id: rest.id, category_id: cat.id,
          name: item.name, description: item.description ?? null,
          price: item.price, is_available: true, sort_order: itemSort++,
        })
        .select("id").single();
      if (miErr) { console.error(`  x ${item.name}: ${miErr.message}`); continue; }

      for (const g of item.modifiers) {
        const { data: mg, error: mgErr } = await admin
          .from("modifier_groups")
          .insert({
            menu_item_id: mi.id, name: g.name,
            min_select: g.min, max_select: g.max, is_required: g.required,
          })
          .select("id").single();
        if (mgErr) { console.error(`    x ${g.name}: ${mgErr.message}`); continue; }

        const rows = g.options.map(([name, delta]) => ({
          group_id: mg.id, name, price_delta: delta,
        }));
        const { error: modErr } = await admin.from("modifiers").insert(rows);
        if (modErr) console.error(`    x options: ${modErr.message}`);
      }
    }
    console.log(`  + ${catName} (${items.length} items)`);
  }
}

console.log("\nSeed complete.");
