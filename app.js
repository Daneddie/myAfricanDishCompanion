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
  currentDish: null,
  cookIndex: 0,
};

const $ = (id) => document.getElementById(id);

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
    DISHES = await res.json();
  } catch (e) {
    $('dishGrid').innerHTML = '<p>Could not load dishes. Please serve via <code>python -m http.server</code>.</p>';
    return;
  }
  initCountries();
  syncUnitRadios();
  bindEvents();
  renderAll();
}

function save() {
  localStorage.setItem('mad_favs', JSON.stringify(state.favorites));
  localStorage.setItem('mad_cooked', JSON.stringify(state.cooked));
  localStorage.setItem('mad_shop', JSON.stringify(state.shoppingDishes));
  localStorage.setItem('mad_checked', JSON.stringify(state.checkedItems));
  localStorage.setItem('mad_cookindex', JSON.stringify(state.cookProgress));
  localStorage.setItem('mad_units', state.units);
}

function initCountries() {
  const countries = [...new Set(DISHES.map((d) => d.country))].sort();
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
  $('search').addEventListener('input', renderGrid);
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
  $('clearShop').addEventListener('click', () => {
    state.shoppingDishes = []; state.checkedItems = []; save(); renderAll();
  });
}

function showView(view) {
  state.view = view;
  ['browse', 'detail', 'cooking', 'cookbook', 'shopping'].forEach((v) => {
    $('view-' + v).hidden = v !== view;
  });
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === view || (view === 'detail' && b.dataset.view === 'browse'))
  );
  if (view === 'cookbook') renderCookbook();
  if (view === 'shopping') renderShopping();
}

function keyIngNames(d) {
  return (d.keyIngredients || []).map((k) => (typeof k === 'string' ? k : k.name));
}

function filteredDishes() {
  const q = $('search').value.trim().toLowerCase();
  const cat = $('categoryFilter').value;
  const country = $('countryFilter').value;
  return DISHES.filter((d) => {
    if (cat && d.category !== cat) return false;
    if (country && d.country !== country) return false;
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
    <div class="photo">${d.photo}</div>
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
    .map((p) => `<button class="btn secondary" data-pair="${p.id}">${p.photo} ${p.name}</button>`)
    .join('');
  $('detail').innerHTML = `
    <div class="detail-photo">${d.photo}</div>
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
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((x) => x !== id)
    : [...state.favorites, id];
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
    <h2>${d.photo} ${d.name}</h2>
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
  if (fin) fin.addEventListener('click', () => { markCooked(d.id); showDetail(d.id); });
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
        return d ? `<li>${d.photo} ${d.name}</li>` : '';
      }).join('')
    : '<li>Not yet — go cook something delicious!</li>';
}

// --- Shopping list ---
function renderShopping() {
  $('shopPicker').innerHTML = DISHES.map((d) => `
    <label><input type="checkbox" data-shop="${d.id}" ${state.shoppingDishes.includes(d.id) ? 'checked' : ''}/>
    ${d.photo} ${d.name}</label>`).join('');
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
