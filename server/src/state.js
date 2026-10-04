import { db, auth } from './auth.js';

// B2: whole-snapshot sync, last-write-wins (documented in V2_PLAN.md).
// Snapshot: { favorites[], cooked[], shoppingDishes[], checkedItems[],
//             cookProgress{}, units }

function cleanStrings(v, max = 500) {
  if (!Array.isArray(v)) return null;
  const out = [...new Set(v.filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 200))];
  return out.slice(0, max);
}

function cleanProgress(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (k.length <= 200 && Number.isInteger(val) && val >= 0 && val < 1000) out[k] = val;
  }
  return out;
}

async function requireUser(req, res) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user) {
    res.status(401).json({ error: 'Not logged in.' });
    return null;
  }
  return session.user;
}

export function registerStateRoutes(app) {
  app.get('/api/state', async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const uid = user.id;
    const [fav, cooked, shop, checks, prog, prefs] = await Promise.all([
      db.selectFrom('favorites').select('dish_id').where('user_id', '=', uid).execute(),
      db.selectFrom('cooked').select('dish_id').where('user_id', '=', uid).execute(),
      db.selectFrom('shopping').select('dish_id').where('user_id', '=', uid).execute(),
      db.selectFrom('shopping_checks').select('item_key').where('user_id', '=', uid).execute(),
      db.selectFrom('cook_progress').select(['dish_id', 'step_index']).where('user_id', '=', uid).execute(),
      db.selectFrom('prefs').select('units').where('user_id', '=', uid).executeTakeFirst(),
    ]);
    const cookProgress = {};
    prog.forEach((r) => { cookProgress[r.dish_id] = r.step_index; });
    res.json({
      favorites: fav.map((r) => r.dish_id),
      cooked: cooked.map((r) => r.dish_id),
      shoppingDishes: shop.map((r) => r.dish_id),
      checkedItems: checks.map((r) => r.item_key),
      cookProgress,
      units: prefs?.units === 'cups' ? 'cups' : 'metric',
    });
  });

  app.put('/api/state', async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const uid = user.id;
    const favorites = cleanStrings(req.body?.favorites);
    const cooked = cleanStrings(req.body?.cooked);
    const shoppingDishes = cleanStrings(req.body?.shoppingDishes);
    const checkedItems = cleanStrings(req.body?.checkedItems);
    const cookProgress = cleanProgress(req.body?.cookProgress);
    const units = req.body?.units === 'cups' ? 'cups' : 'metric';
    if (!favorites || !cooked || !shoppingDishes || !checkedItems || !cookProgress) {
      return res.status(400).json({ error: 'Bad snapshot shape.' });
    }
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('favorites').where('user_id', '=', uid).execute();
      await trx.deleteFrom('cooked').where('user_id', '=', uid).execute();
      await trx.deleteFrom('shopping').where('user_id', '=', uid).execute();
      await trx.deleteFrom('shopping_checks').where('user_id', '=', uid).execute();
      await trx.deleteFrom('cook_progress').where('user_id', '=', uid).execute();
      if (favorites.length) {
        await trx.insertInto('favorites').values(favorites.map((dish_id) => ({ user_id: uid, dish_id }))).execute();
      }
      if (cooked.length) {
        await trx.insertInto('cooked').values(cooked.map((dish_id) => ({ user_id: uid, dish_id }))).execute();
      }
      if (shoppingDishes.length) {
        await trx.insertInto('shopping').values(shoppingDishes.map((dish_id) => ({ user_id: uid, dish_id }))).execute();
      }
      if (checkedItems.length) {
        await trx.insertInto('shopping_checks').values(checkedItems.map((item_key) => ({ user_id: uid, item_key }))).execute();
      }
      const progRows = Object.entries(cookProgress);
      if (progRows.length) {
        await trx.insertInto('cook_progress')
          .values(progRows.map(([dish_id, step_index]) => ({ user_id: uid, dish_id, step_index })))
          .execute();
      }
      await trx.insertInto('prefs').values({ user_id: uid, units })
        .onConflict((oc) => oc.column('user_id').doUpdateSet({ units }))
        .execute();
    });
    res.json({ ok: true });
  });
}
