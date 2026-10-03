# MyAfricanDishCompanion

A warm, homely kitchen companion for West African cooking — like a knowledgeable relative guiding you through the kitchen, not a slick food blog or clinical database.

Starting with **West African dishes**, expanding region by region later.

## What it does (v1 scope)

- **Scope & Discovery**
  - Browse by category (soups, rice, swallow, snacks) or by country of origin
  - Search by dish name or ingredient
- **Dish Information**
  - Photo of the finished dish + key ingredients on each dish card
  - Time, difficulty level, and dietary tags visible at a glance
  - Short cultural / origin blurb per dish (when it's eaten, where it's from)
- **Ingredients**
  - Metric **or** cups/spoons measurement toggle
  - Substitution notes for hard-to-find ingredients, with honest notes on taste/texture impact
- **Cooking Instructions**
  - Numbered steps with time estimates and occasional "why" tips
  - Full readable view + a focused **Start Cooking** step-by-step mode
- **Meal Planning**
  - "Goes well with" pairing suggestions linking to other dishes
  - Auto-generated shopping list from one or more selected dishes
- **Personalization**
  - Save favorites to a personal cookbook
  - "Cooked this" tracking

## This initial version (v0.1)

A dependency-free static prototype — no build step, no backend. Open it and cook.

- `index.html` — app shell (browse, search, dish detail, cooking mode, shopping list, cookbook)
- `styles.css` — warm, homely styling
- `app.js` — all client logic (filtering, units toggle, cooking mode, pairings, shopping list, favorites + cooked tracking via `localStorage`)
- `data/dishes.json` — 14 starter West African dishes with full fields per the spec (schema: prep/cook minutes, servings, country flag, dietary tags + adaptation note, key ingredients with photos, ingredients with honest substitutions, timed steps with "why" tips, 2–3 pairings)
- Dishes: Jollof Rice, Egusi Soup, Efo Riro (Nigeria); Fufu, Waakye, Banku, Kelewele (Ghana); Groundnut Stew (Mafé), Thiéboudienne, Chicken Yassa, Fataya (Senegal); plus Puff-Puff, Akara, Pounded Yam

Favorites, cooked history, shopping list, and unit preference persist in `localStorage`.

## Getting started

No installation needed. Either:

1. Open `index.html` directly in a browser, **or**
2. Serve the folder (recommended, so `fetch` of `data/dishes.json` works everywhere):
   ```bash
   python -m http.server 8000
   # then visit http://localhost:8000
   ```

## Project structure

```
MyAfricanDishCompanion/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── dishes.json
├── myAfricanDishCompanion.docx   # original feature definition
├── README.md
└── .env.example
```

## Roadmap

- More West African dishes, then region-by-region expansion (East, Central, Southern, North Africa)
- Real dish photography
- Backend + accounts so cookbook syncs across devices
- Printable shopping lists / shareable meal plans
- Dietary filters (vegan, gluten-free) and scaled servings

## Tone

Warm and homely — encouraging, patient, honest about substitutions. Every "why" tip and substitution note should read like advice from family.
