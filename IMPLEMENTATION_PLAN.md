# Implementation Plan — MyAfricanDishCompanion V1

Source: `myAfricanDishCompanion_PRD.md` Draft v1 (updated Oct 3, 2026), incl. §12 Technical Decision Note.
Current baseline: static v0.1 (`index.html`, `app.js`, `data/dishes.json`, 6 dishes).

## Stack lock (PRD §12 — applies to all phases)

- **Framework:** None — vanilla HTML/CSS/JS, no build step.
- **Database:** `data/dishes.json` (content) + browser `localStorage` (`mad_favs`, `mad_cooked`, `mad_shop`, `mad_units`) for user state.
- **Auth:** None. **File storage:** local filesystem / `assets/` for images.
- **App & DB run locally for now.** Serve with `python -m http.server 8000`.
- Rejected for V1: SQLite (code with no benefit), Firebase/Supabase (breaks local-only).
- Non-goals (§3): West Africa only, no social/ratings, no planner beyond grouped shopping list, no video/audio. Post-V1 only (§10): summed shopping list, Cook With What You Have, business model.

## Phase 1 — Content schema + West Africa data (PRD §5, §6.2–6.3)
- Freeze schema: `id, name, country, countryFlag, category, prepMinutes, cookMinutes, servingsDefault, difficulty, dietaryTags, adaptationNote, blurb, keyIngredients[{name,photo}], ingredients[{name,metric,cups,substitution,substitutionImpact}], steps[{text,minutes,why}], pairings[2-3]`.
- Migrate 6 dishes: split `timeMinutes` → prep/cook, add flag + servingsDefault + adaptationNote.
- Expand to 12–15 dishes across Nigeria/Ghana/Senegal × Rice / Soups & Stews / Swallow / Snacks.
- Output: `data/dishes.json` validates, no missing required fields.

## Phase 2 — Discovery & Browsing (PRD §6.1)
- Browse by category (Rice, Soups & Stews, Swallow, Snacks) or country, toggleable; fix `index.html` category values.
- Search by dish name or ingredient.
- Cards show: name, country flag, prep/cook time, difficulty, dietary tags.
- Output: category + country filters compose; search “plantain” works; empty states + counts.

## Phase 3 — Dish Detail + Ingredients (PRD §6.2, §6.3, §6.7)
- Real finished-dish photos + key-ingredient visuals (egusi, uda, palm oil).
- Short warm blurb (<60 words), tags + adaptationNote (e.g. meat → mushrooms).
- Full list with default servings, metric/cups toggle persisted.
- Substitution always paired with honest impact note, warm relative tone.
- Output: every dish meets detail spec; tone pass done.

## Phase 4 — Cooking Instructions (PRD §6.4)
- Full scrollable view + Start Cooking one-step view (large text, Step X of Y, next/back).
- Persist `cookIndex` locally; show per-step minutes + “why” tips.
- Replace `alert()` in `markCooked()` with inline confirmation.
- Output: Discover → Cook flow works offline end-to-end.

## Phase 5 — Meal Planning + Personalization (PRD §6.5, §6.6)
- “Goes well with” 2–3 valid links per dish.
- Shopping list grouped by dish (V1 decision — do NOT sum), respects unit toggle, check-off while shopping, clear list.
- My Cookbook: favorites + cooked history with counts and empty states.
- Output: Plan-a-meal and Return-visit flows work locally.

## Phase 6 — Quality, Metrics, Launch (PRD §8, §9)
- Responsive + kitchen usability, keyboard nav, contrast, view handling.
- `fetch` fallback message when not served over http.
- Local-only metrics counters: Start-Cooking open/complete, favorites saved, search usage.
- Cultural-accuracy review; leave §11 opens as fixed time/difficulty + grouped list for V1.
- Output: mobile + desktop QA checklist passes; README updated.
