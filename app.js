// MyAfricanDishCompanion v0.1 — dependency-free prototype.
let DISHES = [];
let state = {
  view: 'browse',
  units: localStorage.getItem('mad_units') || 'metric',
  favorites: JSON.parse(localStorage.getItem('mad_favs') || '[]'),
  cooked: JSON.parse(localStorage.getItem('mad_cooked') || '[]'),
  shoppingDishes: JSON.parse(localStorage.getItem('mad_shop') || '[]'),
  checkedItems: JSON.parse(localStorage.getItem('mad_checked') || '[]'),
  cookProgress: JSON.parse(localStorage.getItem('mad_cookindex') || '{}'),
  metrics: JSON.parse(localStorage.getItem('mad_metrics') || '{"cookOpens":0,"cookCompletes":0,"favAdds":0,"searches":0}'),
  currentDish: null,
  cookIndex: 0,
};

const $ = (id) => document.getElementById(id);

// Backend API (B1). Override with window.MAD_API_BASE before app.js loads.
// Local dev uses localhost; anywhere else defaults to the production API.
const PROD_API_BASE = 'https://mad-api.onrender.com';
const API_BASE = ((typeof window !== 'undefined' && window.MAD_API_BASE)
  || (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? 'http://localhost:4000' : PROD_API_BASE)
).replace(/\/$/, '');
let apiAvailable = false;
let sessionUser = null;

async function api(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(API_BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshSession() {
  const wasLoggedIn = !!sessionUser;
  try {
    const { ok, data } = await api('/api/me');
    apiAvailable = true;
    sessionUser = ok && data && data.user ? data.user : null;
  } catch (e) {
    apiAvailable = false;
    sessionUser = null;
  }
  updateAuthNav();
  if (state.view === 'account') renderAccount();
  if (sessionUser && !wasLoggedIn) syncOnLogin();
}

let pushTimer = null;
let suppressPush = false;

function snapshot() {
  return {
    favorites: [...state.favorites],
    cooked: [...state.cooked],
    shoppingDishes: [...state.shoppingDishes],
    checkedItems: [...state.checkedItems],
    cookProgress: { ...state.cookProgress },
    units: state.units,
  };
}

function applySnapshot(s) {
  suppressPush = true;
  state.favorites = [...(s.favorites || [])];
  state.cooked = [...(s.cooked || [])];
  state.shoppingDishes = [...(s.shoppingDishes || [])];
  state.checkedItems = [...(s.checkedItems || [])];
  state.cookProgress = { ...(s.cookProgress || {}) };
  if (s.units === 'metric' || s.units === 'cups') state.units = s.units;
  save();
  suppressPush = false;
  syncUnitRadios();
  renderAll();
  if (state.currentDish) renderDetail(state.currentDish);
}

function schedulePush() {
  if (suppressPush || !sessionUser || !apiAvailable) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      await api('/api/state', { method: 'PUT', body: JSON.stringify(snapshot()) });
    } catch (e) { /* offline: local copy is truth until next change */ }
  }, 800);
}

function snapshotEmpty(s) {
  return !s.favorites.length && !s.cooked.length && !s.shoppingDishes.length
    && !s.checkedItems.length && !Object.keys(s.cookProgress || {}).length;
}

// First login: server empty + local full -> upload local; else adopt server.
async function syncOnLogin() {
  try {
    const { ok, data } = await api('/api/state');
    if (!ok || !data) return;
    if (snapshotEmpty(data) && !snapshotEmpty(snapshot())) {
      await api('/api/state', { method: 'PUT', body: JSON.stringify(snapshot()) });
      showToast('Your local cookbook was uploaded to your account. 🎉');
    } else if (!snapshotEmpty(data)) {
      applySnapshot(data);
      showToast('Synced your cookbook from your account. 🎉');
    }
  } catch (e) { /* offline: stay local */ }
}

function updateAuthNav() {
  const btn = $('authNavBtn');
  if (!btn) return;
  btn.textContent = sessionUser ? `👤 ${sessionUser.name || sessionUser.email}` : 'Log in / Sign up';
}

let toastTimer = null;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}

async function load() {
  try {
    const res = await fetch('data/dishes.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('bad shape');
    DISHES = data;
  } catch (e) {
    $('dishGrid').innerHTML = '<p>Could not load dishes. Please serve via <code>python -m http.server</code> (opening index.html directly blocks data loading in some browsers).</p>';
    return;
  }
  initCountries();
  syncUnitRadios();
  bindEvents();
  renderAll();
  refreshSession();
}

function save() {
  localStorage.setItem('mad_favs', JSON.stringify(state.favorites));
  localStorage.setItem('mad_cooked', JSON.stringify(state.cooked));
  localStorage.setItem('mad_shop', JSON.stringify(state.shoppingDishes));
  localStorage.setItem('mad_checked', JSON.stringify(state.checkedItems));
  localStorage.setItem('mad_cookindex', JSON.stringify(state.cookProgress));
  localStorage.setItem('mad_metrics', JSON.stringify(state.metrics));
  localStorage.setItem('mad_units', state.units);
  schedulePush();
}

function bumpMetric(key) {
  state.metrics[key] = (state.metrics[key] || 0) + 1;
  try { localStorage.setItem('mad_metrics', JSON.stringify(state.metrics)); } catch (e) { /* private mode */ }
}

function initCountries() {
  const countries = [...new Set(DISHES.flatMap((d) => d.country.split('/').map((s) => s.trim())))].sort();
  const sel = $('countryFilter');
  countries.forEach((c) => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
}

function syncUnitRadios() {
  document.querySelectorAll('input[name="units"]').forEach((r) => {
    r.checked = r.value === state.units;
  });
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.addEventListener('click', () => showView(b.dataset.view))
  );
  let searchTimer = null;
  $('search').addEventListener('input', () => {
    renderGrid();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if ($('search').value.trim().length > 1) bumpMetric('searches');
    }, 1000);
  });
  $('categoryFilter').addEventListener('change', renderGrid);
  $('countryFilter').addEventListener('change', renderGrid);
  document.querySelectorAll('input[name="units"]').forEach((r) =>
    r.addEventListener('change', (e) => {
      state.units = e.target.value; save();
      renderGrid();
      if (state.currentDish) renderDetail(state.currentDish);
    })
  );
  $('backBtn').addEventListener('click', () => showView('browse'));
  $('exitCookingBtn').addEventListener('click', () => showDetail(state.currentDish));
  document.addEventListener('keydown', (e) => {
    if (state.view !== 'cooking') return;
    if (e.key === 'ArrowRight') { const n = $('nextStep'); if (n) n.click(); }
    else if (e.key === 'ArrowLeft') { const p = $('prevStep'); if (p && !p.disabled) p.click(); }
    else if (e.key === 'Escape') { showDetail(state.currentDish); }
  });
  $('clearShop').addEventListener('click', () => {
    state.shoppingDishes = []; state.checkedItems = []; save(); renderAll();
  });
}

function showView(view) {
  state.view = view;
  ['browse', 'detail', 'cooking', 'cookbook', 'shopping', 'account'].forEach((v) => {
    $('view-' + v).hidden = v !== view;
  });
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === view || (view === 'detail' && b.dataset.view === 'browse'))
  );
  if (view === 'cookbook') renderCookbook();
  if (view === 'shopping') renderShopping();
  if (view === 'account') renderAccount();
}

function keyIngNames(d) {
  return (d.keyIngredients || []).map((k) => (typeof k === 'string' ? k : k.name));
}

// Real photo when supplied (data/dishes.json "image"), emoji stand-in otherwise.
function dishImg(d, cls) {
  if (d.image) return `<img class="${cls}" src="${d.image}" alt="Photo of ${d.name}" loading="lazy" />`;
  return `<span class="${cls} emoji">${d.photo}</span>`;
}

function filteredDishes() {
  const q = $('search').value.trim().toLowerCase();
  const cat = $('categoryFilter').value;
  const country = $('countryFilter').value;
  return DISHES.filter((d) => {
    if (cat && d.category !== cat) return false;
    if (country && !d.country.split('/').map((s) => s.trim()).includes(country)) return false;
    if (!q) return true;
    const hay = (d.name + ' ' + d.country + ' ' + d.ingredients.map((i) => i.name).join(' ') + ' ' + keyIngNames(d).join(' ')).toLowerCase();
    return hay.includes(q);
  });
}

function dishCard(d) {
  const fav = state.favorites.includes(d.id) ? '❤️ ' : '';
  const flag = d.countryFlag ? `${d.countryFlag} ` : '';
  const timeLabel = `⏱ prep ${d.prepMinutes} + cook ${d.cookMinutes} min`;
  return `<div class="card" data-id="${d.id}">
    ${dishImg(d, 'photo')}
    <h3>${fav}${d.name}</h3>
    <div class="meta">
      <span class="pill">${flag}${d.country}</span>
      <span class="pill">${d.category}</span>
      <span class="pill">${timeLabel}</span>
      <span class="pill">${d.difficulty}</span>
    </div>
    <p class="muted">${d.dietaryTags.join(' · ')}</p>
    <p class="muted">${keyIngNames(d).join(', ')}</p>
  </div>`;
}

function renderGrid() {
  const list = filteredDishes();
  const total = DISHES.length;
  $('resultCount').textContent = list.length === total
    ? `Showing all ${total} dishes`
    : `Showing ${list.length} of ${total} dishes`;
  $('dishGrid').innerHTML = list.length
    ? list.map(dishCard).join('')
    : '<p>No dishes found — try another search, like "rice" or "peanut". <button class="link" id="clearFilters">Clear search &amp; filters</button></p>';
  document.querySelectorAll('#dishGrid .card').forEach((c) =>
    c.addEventListener('click', () => showDetail(c.dataset.id))
  );
  const clear = $('clearFilters');
  if (clear) clear.addEventListener('click', () => {
    $('search').value = '';
    $('categoryFilter').value = '';
    $('countryFilter').value = '';
    renderGrid();
  });
}

function unitQty(ing) {
  return state.units === 'metric' ? ing.metric : ing.cups;
}

function showDetail(id) {
  state.currentDish = id;
  renderDetail(id);
  showView('detail');
}

function renderDetail(id) {
  const d = DISHES.find((x) => x.id === id);
  if (!d) return;
  const isFav = state.favorites.includes(d.id);
  const inShop = state.shoppingDishes.includes(d.id);
  const pairLinks = d.pairings
    .map((pid) => DISHES.find((x) => x.id === pid))
    .filter(Boolean)
    .map((p) => `<button class="btn secondary" data-pair="${p.id}">${dishImg(p, 'thumb')} ${p.name}</button>`)
    .join('');
  $('detail').innerHTML = `
    ${dishImg(d, 'detail-photo')}
    <h2>${d.name}</h2>
    <div class="meta">
      <span class="pill">${d.countryFlag ? `${d.countryFlag} ` : ''}${d.country}</span>
      <span class="pill">${d.category}</span>
      <span class="pill">⏱ prep ${d.prepMinutes} + cook ${d.cookMinutes} min</span>
      <span class="pill">${d.difficulty}</span>
      <span class="pill">Serves ${d.servingsDefault}</span>
      ${d.dietaryTags.map((t) => `<span class="pill">${t}</span>`).join('')}
    </div>
    <p class="blurb">${d.blurb}</p>
    ${d.adaptationNote ? `<p class="why">🌱 ${d.adaptationNote}</p>` : ''}
    <p class="muted">Key ingredients: ${(d.keyIngredients || []).map((k) => (typeof k === 'string' ? k : `${k.photo ? k.photo + ' ' : ''}${k.name}`)).join(' · ')}</p>
    <h3>Ingredients for ${d.servingsDefault} servings (${state.units === 'metric' ? 'metric' : 'cups/spoons'})</h3>
    <ul>${d.ingredients.map((i) => `
      <li><strong>${i.name}</strong> — ${unitQty(i)}
      ${i.substitution ? `<br/><span class="sub">Swap: ${i.substitution}. Honest note: ${i.substitutionImpact}</span>` : ''}
      </li>`).join('')}</ul>
    <h3>Steps</h3>
    <ol class="steps">${d.steps.map((s) => `
      <li>${s.text} ${s.minutes ? `<em>(${s.minutes} min)</em>` : ''}
      ${s.why ? `<span class="why">💡 Why: ${s.why}</span>` : ''}</li>`).join('')}</ol>
    <h3>Goes well with</h3>
    <p>${pairLinks || '—'}</p>
    <button class="btn" id="startCooking">${Number.isInteger(state.cookProgress[d.id]) && state.cookProgress[d.id] > 0 ? `▶ Resume cooking (step ${state.cookProgress[d.id] + 1})` : '▶ Start Cooking'}</button>
    <button class="btn secondary" id="favBtn">${isFav ? '💔 Remove from cookbook' : '❤️ Save to cookbook'}</button>
    <button class="btn secondary" id="shopBtn">${inShop ? '✓ In shopping list' : '+ Add to shopping list'}</button>
    <button class="btn secondary" id="mealBtn">🧺 Add meal (this + pairings)</button>
    <button class="btn secondary" id="cookedBtn">🍳 I cooked this</button>
  `;
  $('startCooking').addEventListener('click', () => startCooking(d.id));
  $('favBtn').addEventListener('click', () => toggleFav(d.id));
  $('shopBtn').addEventListener('click', () => toggleShop(d.id));
  $('mealBtn').addEventListener('click', () => addMealToShopping(d.id));
  $('cookedBtn').addEventListener('click', () => markCooked(d.id));
  document.querySelectorAll('[data-pair]').forEach((b) =>
    b.addEventListener('click', () => showDetail(b.dataset.pair))
  );
}

function toggleFav(id) {
  const adding = !state.favorites.includes(id);
  state.favorites = adding
    ? [...state.favorites, id]
    : state.favorites.filter((x) => x !== id);
  if (adding) bumpMetric('favAdds');
  save(); renderAll(); renderDetail(id);
}

function toggleShop(id) {
  state.shoppingDishes = state.shoppingDishes.includes(id)
    ? state.shoppingDishes.filter((x) => x !== id)
    : [...state.shoppingDishes, id];
  pruneChecked();
  save(); renderAll(); renderDetail(id);
}

function addMealToShopping(id) {
  const d = DISHES.find((x) => x.id === id);
  if (!d) return;
  const meal = [id, ...(d.pairings || [])].filter((pid) => DISHES.some((x) => x.id === pid));
  let added = 0;
  meal.forEach((pid) => {
    if (!state.shoppingDishes.includes(pid)) {
      state.shoppingDishes.push(pid);
      added++;
    }
  });
  save(); renderAll(); renderDetail(id);
  showToast(added ? `Meal added — ${added} dish${added > 1 ? 'es' : ''} in your shopping list. 🧺` : 'That whole meal is already on your list. 🧺');
}

function shopKey(dishId, ingName) {
  return `${dishId}|${ingName}`;
}

function pruneChecked() {
  const valid = new Set();
  state.shoppingDishes.forEach((id) => {
    const d = DISHES.find((x) => x.id === id);
    if (d) d.ingredients.forEach((i) => valid.add(shopKey(id, i.name)));
  });
  state.checkedItems = state.checkedItems.filter((k) => valid.has(k));
}

function markCooked(id) {
  const d = DISHES.find((x) => x.id === id);
  const firstTime = !state.cooked.includes(id);
  if (firstTime) state.cooked.push(id);
  delete state.cookProgress[id];
  save(); renderAll(); renderDetail(id);
  showToast(firstTime
    ? `Well done — ${d ? d.name : 'dish'} added to your cooked list. 🎉`
    : 'Already in your cooked list — lovely repeat. 🎉');
}

// --- Cooking mode ---
function startCooking(id) {
  state.currentDish = id;
  const d = DISHES.find((x) => x.id === id);
  const saved = state.cookProgress[id];
  state.cookIndex = (Number.isInteger(saved) && d && saved >= 0 && saved < d.steps.length) ? saved : 0;
  bumpMetric('cookOpens');
  renderCooking();
  showView('cooking');
}

function setCookIndex(id, i) {
  state.cookIndex = i;
  state.cookProgress[id] = i;
  save();
  renderCooking();
}

function renderCooking() {
  const d = DISHES.find((x) => x.id === state.currentDish);
  const step = d.steps[state.cookIndex];
  const pct = Math.round(((state.cookIndex + 1) / d.steps.length) * 100);
  $('cooking').innerHTML = `
    <h2>${dishImg(d, 'thumb')} ${d.name}</h2>
    <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
    <p class="muted">Step ${state.cookIndex + 1} of ${d.steps.length}</p>
    <p class="step">${step.text}</p>
    ${step.minutes ? `<p class="pill">⏱ about ${step.minutes} min</p>` : ''}
    ${step.why ? `<p class="why">💡 ${step.why}</p>` : ''}
    <div class="cook-nav">
      <button class="btn secondary" id="prevStep" ${state.cookIndex === 0 ? 'disabled' : ''}>← Back</button>
      ${state.cookIndex < d.steps.length - 1
        ? '<button class="btn" id="nextStep">Next →</button>'
        : '<button class="btn" id="finishCook">🎉 Finish & mark cooked</button>'}
    </div>
    <p><button class="link" id="restartCook">Restart from step 1</button></p>`;
  const prev = $('prevStep'), next = $('nextStep'), fin = $('finishCook');
  if (prev) prev.addEventListener('click', () => setCookIndex(d.id, state.cookIndex - 1));
  if (next) next.addEventListener('click', () => setCookIndex(d.id, state.cookIndex + 1));
  if (fin) fin.addEventListener('click', () => { bumpMetric('cookCompletes'); markCooked(d.id); showDetail(d.id); });
  $('restartCook').addEventListener('click', () => setCookIndex(d.id, 0));
}

// --- Cookbook ---
function renderCookbook() {
  const favs = DISHES.filter((d) => state.favorites.includes(d.id));
  $('favHeader').textContent = `❤️ Favourites (${favs.length})`;
  $('cookedHeader').textContent = `🍳 Cooked (${state.cooked.length})`;
  $('favGrid').innerHTML = favs.length ? favs.map(dishCard).join('') : '<p>Nothing saved yet — tap ❤️ on any dish.</p>';
  document.querySelectorAll('#favGrid .card').forEach((c) =>
    c.addEventListener('click', () => showDetail(c.dataset.id))
  );
  $('cookedList').innerHTML = state.cooked.length
    ? state.cooked.map((id) => {
        const d = DISHES.find((x) => x.id === id);
        return d ? `<li>${dishImg(d, 'thumb')} ${d.name}</li>` : '';
      }).join('')
    : '<li>Not yet — go cook something delicious!</li>';
}

// --- Shopping list ---
function renderShopping() {
  $('shopPicker').innerHTML = DISHES.map((d) => `
    <label><input type="checkbox" data-shop="${d.id}" ${state.shoppingDishes.includes(d.id) ? 'checked' : ''}/>
    ${dishImg(d, 'thumb')} ${d.name}</label>`).join('');
  document.querySelectorAll('[data-shop]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const id = cb.dataset.shop;
      state.shoppingDishes = cb.checked
        ? [...state.shoppingDishes, id]
        : state.shoppingDishes.filter((x) => x !== id);
      pruneChecked();
      save(); renderShopping(); updateCounts();
    })
  );
  const items = [];
  state.shoppingDishes.forEach((id) => {
    const d = DISHES.find((x) => x.id === id);
    if (!d) return;
    d.ingredients.forEach((i) => {
      const key = shopKey(id, i.name);
      const done = state.checkedItems.includes(key);
      items.push(`<li class="${done ? 'done' : ''}"><label><input type="checkbox" data-item="${key}" ${done ? 'checked' : ''}/> ${i.name} — ${unitQty(i)} <span class="muted">(${d.name})</span></label></li>`);
    });
  });
  $('shopList').innerHTML = items.length ? items.join('') : '<li>Your list is empty.</li>';
  document.querySelectorAll('[data-item]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const key = cb.dataset.item;
      state.checkedItems = cb.checked
        ? [...state.checkedItems, key]
        : state.checkedItems.filter((k) => k !== key);
      save();
      cb.closest('li').classList.toggle('done', cb.checked);
    })
  );
}

// --- Account (B1: login UI; anonymous local mode untouched) ---
let authMode = 'login'; // or 'signup'

function renderAccount() {
  const box = $('accountBox');
  if (!apiAvailable) {
    box.innerHTML = '<p>Account server is offline — your cookbook keeps working on this device. Start the API to log in.</p>';
    return;
  }
  if (sessionUser) {
    box.innerHTML = `
      <p>Logged in as <strong>${sessionUser.email}</strong>.</p>
      <p class="muted">Sync of cookbook data across devices lands in B2 — for now your lists stay on this device.</p>
      <button class="btn secondary" id="logoutBtn">Log out</button>`;
    $('logoutBtn').addEventListener('click', async () => {
      await api('/api/auth/sign-out', { method: 'POST' });
      clearTimeout(pushTimer);
      sessionUser = null;
      updateAuthNav(); renderAccount();
      showToast('Logged out. Your local cookbook stays put. 👋');
    });
    return;
  }
  const isSignup = authMode === 'signup';
  box.innerHTML = `
    <div class="auth-tabs">
      <button class="btn ${!isSignup ? '' : 'secondary'}" id="tabLogin">Log in</button>
      <button class="btn ${isSignup ? '' : 'secondary'}" id="tabSignup">Sign up</button>
    </div>
    <form id="authForm">
      ${isSignup ? '<p><label>Name<br/><input id="authName" type="text" autocomplete="name" required /></label></p>' : ''}
      <p><label>Email<br/><input id="authEmail" type="email" autocomplete="email" required /></label></p>
      <p><label>Password (8+ characters)<br/><input id="authPassword" type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" minlength="8" required /></label></p>
      <p id="authError" class="error" hidden></p>
      <button class="btn" type="submit">${isSignup ? 'Create account' : 'Log in'}</button>
    </form>`;
  $('tabLogin').addEventListener('click', () => { authMode = 'login'; renderAccount(); });
  $('tabSignup').addEventListener('click', () => { authMode = 'signup'; renderAccount(); });
  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('authError');
    err.hidden = true;
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const endpoint = isSignup ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email';
    const payload = isSignup
      ? { name: $('authName').value.trim(), email, password }
      : { email, password };
    try {
      const { ok, data } = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      if (!ok) throw new Error((data && (data.message || data.error)) || 'Something went wrong — please try again.');
      await refreshSession();
      showToast(isSignup ? 'Account created — welcome! 🎉' : 'Welcome back! 🎉');
    } catch (ex) {
      err.textContent = ex.message === 'Failed to fetch' || ex.name === 'AbortError'
        ? 'Cannot reach the account server. Is the API running?'
        : ex.message;
      err.hidden = false;
    }
  });
}

function updateCounts() {
  $('favCount').textContent = state.favorites.length ? `(${state.favorites.length})` : '';
  $('shopCount').textContent = state.shoppingDishes.length ? `(${state.shoppingDishes.length})` : '';
}

function renderAll() {
  updateCounts();
  renderGrid();
  if (state.view === 'cookbook') renderCookbook();
  if (state.view === 'shopping') renderShopping();
}

document.addEventListener('DOMContentLoaded', load);
