// MyAfricanDishCompanion v0.1 — dependency-free prototype.
let DISHES = [];
let state = {
  view: 'browse',
  units: localStorage.getItem('mad_units') || 'metric',
  favorites: JSON.parse(localStorage.getItem('mad_favs') || '[]'),
  cooked: JSON.parse(localStorage.getItem('mad_cooked') || '[]'),
  shoppingDishes: JSON.parse(localStorage.getItem('mad_shop') || '[]'),
  currentDish: null,
  cookIndex: 0,
};

const $ = (id) => document.getElementById(id);

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
    state.shoppingDishes = []; save(); renderAll();
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

function filteredDishes() {
  const q = $('search').value.trim().toLowerCase();
  const cat = $('categoryFilter').value;
  const country = $('countryFilter').value;
  return DISHES.filter((d) => {
    if (cat && d.category !== cat) return false;
    if (country && d.country !== country) return false;
    if (!q) return true;
    const hay = (d.name + ' ' + d.country + ' ' + d.ingredients.map((i) => i.name).join(' ')).toLowerCase();
    return hay.includes(q);
  });
}

function dishCard(d) {
  const fav = state.favorites.includes(d.id) ? '❤️ ' : '';
  return `<div class="card" data-id="${d.id}">
    <div class="photo">${d.photo}</div>
    <h3>${fav}${d.name}</h3>
    <div class="meta">
      <span class="pill">${d.country}</span>
      <span class="pill">${d.category}</span>
      <span class="pill">⏱ ${d.timeMinutes} min</span>
      <span class="pill">${d.difficulty}</span>
    </div>
    <p class="muted">${d.dietaryTags.join(' · ')}</p>
    <p class="muted">${d.keyIngredients.join(', ')}</p>
  </div>`;
}

function renderGrid() {
  const list = filteredDishes();
  $('dishGrid').innerHTML = list.length
    ? list.map(dishCard).join('')
    : '<p>No dishes found — try another search, like "rice" or "peanut".</p>';
  document.querySelectorAll('#dishGrid .card').forEach((c) =>
    c.addEventListener('click', () => showDetail(c.dataset.id))
  );
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
      <span class="pill">${d.country}</span>
      <span class="pill">${d.category}</span>
      <span class="pill">⏱ ${d.timeMinutes} min</span>
      <span class="pill">${d.difficulty}</span>
      ${d.dietaryTags.map((t) => `<span class="pill">${t}</span>`).join('')}
    </div>
    <p class="blurb">${d.blurb}</p>
    <h3>Ingredients (${state.units === 'metric' ? 'metric' : 'cups/spoons'})</h3>
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
    <button class="btn" id="startCooking">▶ Start Cooking</button>
    <button class="btn secondary" id="favBtn">${isFav ? '💔 Remove from cookbook' : '❤️ Save to cookbook'}</button>
    <button class="btn secondary" id="shopBtn">${inShop ? '✓ In shopping list' : '+ Add to shopping list'}</button>
    <button class="btn secondary" id="cookedBtn">🍳 I cooked this</button>
  `;
  $('startCooking').addEventListener('click', () => startCooking(d.id));
  $('favBtn').addEventListener('click', () => toggleFav(d.id));
  $('shopBtn').addEventListener('click', () => toggleShop(d.id));
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
  save(); renderAll(); renderDetail(id);
}

function markCooked(id) {
  if (!state.cooked.includes(id)) state.cooked.push(id);
  save(); renderAll(); renderDetail(id);
  alert('Well done! Added to your cooked list. 🎉');
}

// --- Cooking mode ---
function startCooking(id) {
  state.currentDish = id;
  state.cookIndex = 0;
  renderCooking();
  showView('cooking');
}

function renderCooking() {
  const d = DISHES.find((x) => x.id === state.currentDish);
  const step = d.steps[state.cookIndex];
  $('cooking').innerHTML = `
    <h2>${d.photo} ${d.name}</h2>
    <p class="muted">Step ${state.cookIndex + 1} of ${d.steps.length}</p>
    <p class="step">${step.text}</p>
    ${step.minutes ? `<p class="pill">⏱ about ${step.minutes} min</p>` : ''}
    ${step.why ? `<p class="why">💡 ${step.why}</p>` : ''}
    <div class="cook-nav">
      <button class="btn secondary" id="prevStep" ${state.cookIndex === 0 ? 'disabled' : ''}>← Back</button>
      ${state.cookIndex < d.steps.length - 1
        ? '<button class="btn" id="nextStep">Next →</button>'
        : '<button class="btn" id="finishCook">🎉 Finish & mark cooked</button>'}
    </div>`;
  const prev = $('prevStep'), next = $('nextStep'), fin = $('finishCook');
  if (prev) prev.addEventListener('click', () => { state.cookIndex--; renderCooking(); });
  if (next) next.addEventListener('click', () => { state.cookIndex++; renderCooking(); });
  if (fin) fin.addEventListener('click', () => { markCooked(d.id); showDetail(d.id); });
}

// --- Cookbook ---
function renderCookbook() {
  const favs = DISHES.filter((d) => state.favorites.includes(d.id));
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
      save(); renderShopping(); updateCounts();
    })
  );
  const items = [];
  state.shoppingDishes.forEach((id) => {
    const d = DISHES.find((x) => x.id === id);
    if (!d) return;
    d.ingredients.forEach((i) => items.push(`${i.name} — ${unitQty(i)} <span class="muted">(${d.name})</span>`));
  });
  $('shopList').innerHTML = items.length ? items.map((t) => `<li>${t}</li>`).join('') : '<li>Your list is empty.</li>';
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
