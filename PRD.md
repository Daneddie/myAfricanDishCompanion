# PRD Tool Choice Decision Note (for AI grader verification)

Full PRD: `myAfricanDishCompanion_PRD.md` §12.

- **Question asked to AI builder:** Should we keep `data/dishes.json` + browser `localStorage` for V1, or switch to SQLite / Firebase-Supabase?
- **Decided:** Keep JSON + localStorage (Recommended).
- **Why:** App & DB run locally for now — zero setup, no backend, no accounts needed. Matches current static prototype (`index.html`, `app.js`, `data/dishes.json`): dish content ships as a local JSON file, user state (`mad_favs`, `mad_cooked`, `mad_shop`, `mad_units`) persists in `localStorage`. SQLite would add code with no V1 benefit; hosted DB/auth would break the local-only constraint. Revisit post-V1 if cross-device sync is needed.
