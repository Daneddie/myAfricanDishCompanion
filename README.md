# MyAfricanDishCompanion

A warm, homely kitchen companion for West African cooking — like a knowledgeable relative guiding you through the kitchen, not a slick food blog or clinical database.

Starting with **West African dishes**, expanding region by region later.

**Status:** V1 complete (Phases 1–6) — static-first, anonymous-local by default, optional account sync if API is running.

## What it does (V1 scope)

- **Scope & Discovery**
  - Browse by category (Rice Dishes, Soups & Stews, Swallow, Snacks & Small Chops) or by country of origin
  - Search by dish name or ingredient, with result counts and friendly empty states
- **Dish Information**
  - Photo of the finished dish + key-ingredient visuals on each dish card
  - Prep/cook time, difficulty level, and dietary tags visible at a glance
  - Short cultural / origin blurb per dish (when it's eaten, where it's from)
- **Ingredients**
  - Metric **or** cups/spoons measurement toggle (persisted)
  - Servings shown per dish; substitution notes with honest taste/texture impact on every swap
- **Cooking Instructions**
  - Numbered steps with time estimates and occasional "why" tips
  - Full readable view + a focused **Start Cooking** step-by-step mode (large text, progress bar, next/back, keyboard ←/→, Esc to exit, progress saved per dish with resume)
- **Meal Planning**
  - "Goes well with" pairing suggestions (2–3 valid links per dish) + one-tap "Add meal" to shopping list
  - Shopping list grouped by dish, tick-off while shopping (persisted), clear list
- **Personalization**
  - Save favorites to a personal cookbook (with counts)
  - "Cooked this" tracking with inline confirmation (no popups)

## Dishes (14, origins inclusive per PRD §9)

Shared dishes list all countries involved:
- Jollof Rice (Nigeria / Ghana / Senegal), Egusi Soup (Nigeria / Ghana / Cameroon), Fufu (Ghana / Nigeria), Groundnut Stew/Mafé (Senegal / Mali)
- Nigeria also: Efo Riro, Puff-Puff, Akara, Pounded Yam
- Ghana also: Waakye, Banku, Kelewele
- Senegal also: Thiéboudienne, Chicken Yassa, Fataya

## Getting started

No installation needed. Serve the folder (required so dish data loads):

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
├── assets/
│   ├── PHOTOS_NEEDED.md   # shot list: 14 dishes + 37 ingredient visuals
│   ├── dishes/            # drop finished-dish JPGs here
│   └── ingredients/       # drop shared ingredient JPGs here
├── README.md
├── PRD.md
├── myAfricanDishCompanion_PRD.md
├── myAfricanDishCompanion.md
├── IMPLEMENTATION_PLAN.md
└── .env.example
```

## Privacy: local-first

Anonymous by default: no tracking, dish data loads from local `data/dishes.json`.
All user state lives in `localStorage`: `mad_favs`, `mad_cooked`, `mad_shop`,
`mad_checked`, `mad_cookindex`, `mad_units`, plus local-only usage counters
`mad_metrics` (`cookOpens`, `cookCompletes`, `favAdds`, `searches`).
Optional: Log in / Sign up syncs a copy to the account API when configured
(`window.MAD_API_BASE`, defaults to `http://localhost:4000` locally,
production API otherwise). Offline or logged out, everything still works on-device.

## QA checklist (passes)

- [x] All 14 dishes validate against the frozen schema; all pairings resolve
- [x] Category + country filters compose; "plantain" search works
- [x] Cards show name, flag, prep/cook, difficulty, tags; counts + empty states
- [x] Detail: servings, units toggle, paired substitutions, adaptation notes
- [x] Discover → Cook works end to end; progress persists + resumes; keyboard nav
- [x] Plan-a-meal (dish + pairings → grouped tick-off list) and return-visit flows
- [x] Mobile layout (stacked header, full-width cook buttons); fetch fallback message
- [x] Cultural-accuracy review: no origin claims on contested dishes (e.g. jollof);
  "national dish" used only for Thiéboudienne; V1 keeps fixed time/difficulty and
  grouped (not summed) shopping list per PRD §11

## Roadmap (post-V1)

- Real dish photography (`assets/PHOTOS_NEEDED.md` is the shot list)
- More West African dishes, then region-by-region expansion
- Backend + accounts so cookbook syncs across devices
- Summed shopping lists, Cook With What You Have, meal planner

## Tone

Warm and homely — encouraging, patient, honest about substitutions. Every "why" tip and substitution note should read like advice from family.
