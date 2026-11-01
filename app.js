'use strict';

(() => {
  const STORAGE_KEY = 'yumioFrontendStateV7';
  const SESSION_KEY = 'yumioCurrentUser';
  const CART_KEY = 'yumioCartV7';
  const RESERVATION_DRAFT_KEY = 'yumioReservationDraftV1';

  // Real authentication is provided by the backend, not browser-stored credentials.
  const API_BASE = '/api';
  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
      });
    } catch {
      throw new Error('Cannot reach the Yumio backend. Start node server.js and use http://127.0.0.1:3000/');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  }

  const SEED_MENU = [
    {
      "id": "item-1",
      "name": "Maldivian Breakfast",
      "category": "Breakfast",
      "price": 85.0,
      "description": "Traditional Maldivian breakfast featuring authentic island flavors. Freshly prepared flatbread is served with aromatic tuna curry, creamy coconut-based dishes, spicy sambal, and tropical accompaniments. Simple, wholesome, and rich in local ingredients, it offers a perfect balance of savory flavors to start the day.",
      "icon": "🥣",
      "available": true
    },
    {
      "id": "item-2",
      "name": "Grilled Spring Chicken",
      "category": "Breakfast",
      "price": 25.0,
      "description": "Juicy grilled chicken breast served with creamy mashed potatoes, golden potato wedges, crisp garden lettuce, and a rich mushroom cream sauce for a hearty and satisfying meal.",
      "icon": "🍗",
      "available": true
    },
    {
      "id": "item-3",
      "name": "Classic Healthy Breakfast",
      "category": "Breakfast",
      "price": 55.0,
      "description": "A wholesome breakfast featuring a sunny-side-up egg, crispy beef bacon, sliced avocado, cheese, toasted bread, creamy oatmeal topped with fresh fruits, and your choice of coffee or fresh orange juice.",
      "icon": "🍳",
      "available": true
    },
    {
      "id": "item-4",
      "name": "Mushroom Omelette Breakfast Combo",
      "category": "Breakfast",
      "price": 85.0,
      "description": "A light and fluffy mushroom omelette served with toasted bread, fresh guacamole, a green salad, and your choice of orange juice or matcha for a delicious and balanced breakfast.",
      "icon": "🍳",
      "available": true
    },
    {
      "id": "item-5",
      "name": "Signature Chef's Breakfast",
      "category": "Breakfast",
      "price": 85.0,
      "description": "A wholesome breakfast experience featuring farm-fresh eggs, crispy beef bacon, ripe avocado, cheese, toasted bread, creamy fruit oatmeal, and your choice of freshly brewed coffee, orange juice, or premium matcha—crafted to give you the perfect start to your morning.",
      "icon": "🥑",
      "available": true
    },
    {
      "id": "item-6",
      "name": "Tuna Bites",
      "category": "Startar",
      "price": 25.0,
      "description": "Bite-sized tuna snacks that can be prepared in different styles, including Mediterranean herb bites and blackened seared tuna. The tuna is paired with fresh herbs and bold seasonings for a flavorful seafood appetizer.",
      "icon": "🐟",
      "available": true
    },
    {
      "id": "item-7",
      "name": "Crispy Fried Shrimps",
      "category": "Startar",
      "price": 25.0,
      "description": "Golden-brown crispy fried shrimp served with creamy and spicy dipping sauces, fresh lemon and garnish.",
      "icon": "🍤",
      "available": true
    },
    {
      "id": "item-8",
      "name": "Fish & Chips",
      "category": "Startar",
      "price": null,
      "description": "Classic battered fish served with thick-cut fries, creamy tartar sauce, fresh dill and a lemon wedge.",
      "icon": "🐟",
      "available": true
    },
    {
      "id": "item-9",
      "name": "Lamb Chops",
      "category": "Startar",
      "price": 85.0,
      "description": "Four cooked lamb chops served with rosemary, colorful vegetables and a rich caramelized glaze.",
      "icon": "🍖",
      "available": true
    },
    {
      "id": "item-10",
      "name": "Chicken 65",
      "category": "Startar",
      "price": 55.0,
      "description": "Crispy fried chicken pieces coated in a spicy red-orange glaze, garnished with curry leaves, dried chilies and fresh lime.",
      "icon": "🍗",
      "available": true
    },
    {
      "id": "item-11",
      "name": "Lebanese Chicken",
      "category": "Main Course",
      "price": 85.0,
      "description": "Lebanese chicken is a flavorful dish combining tender chicken with aromatic spices and creamy yoghurt. The chicken is marinated with yoghurt, lemon juice and spices, then grilled or baked until cooked through.",
      "icon": "🍗",
      "available": true
    },
    {
      "id": "item-12",
      "name": "Nasi Goreng",
      "category": "Main Course",
      "price": 65.0,
      "description": "Nasi goreng is Indonesia's iconic fried rice, characterized by its sweet, savory and smoky flavors, typically made with day-old rice, sweet soy sauce, shrimp paste, and a mix of proteins and vegetables.",
      "icon": "🍚",
      "available": true
    },
    {
      "id": "item-13",
      "name": "Bami Goreng",
      "category": "Main Course",
      "price": 75.0,
      "description": "A classic Indonesian stir-fried noodle dish combining savory, sweet and spicy flavors with noodles, vegetables and protein. It is typically made with noodles, vegetables, egg or meat, soy sauce and kecap manis.",
      "icon": "🍜",
      "available": true
    },
    {
      "id": "item-14",
      "name": "Chicken Fried Rice",
      "category": "Main Course",
      "price": 55.0,
      "description": "A flavorful stir-fried rice dish made with cooked rice, chicken, eggs, vegetables and seasonings, prepared in a wok for a savory restaurant-style taste.",
      "icon": "🍚",
      "available": true
    },
    {
      "id": "item-15",
      "name": "Tuna Rice",
      "category": "Main Course",
      "price": 55.0,
      "description": "A tuna rice bowl with hot rice topped with canned tuna mixed with mayo and black pepper.",
      "icon": "🍚",
      "available": true
    },
    {
      "id": "item-16",
      "name": "Chicken Biryani",
      "category": "Main Course",
      "price": 65.0,
      "description": "A fragrant, layered rice dish with tender chicken, aromatic spices and rich flavors. Long-grain basmati rice is combined with marinated chicken and spices such as cumin, coriander, cloves, cinnamon and cardamom.",
      "icon": "🍛",
      "available": true
    },
    {
      "id": "item-17",
      "name": "Sizzling Chocolate Brownie",
      "category": "Desserts",
      "price": 55.0,
      "description": "A fudgy chocolate brownie topped with a scoop of ice cream and drizzled with melted chocolate sauce, served on a hot sizzling plate for a hot-and-cold dessert experience.",
      "icon": "🍫",
      "available": true
    },
    {
      "id": "item-18",
      "name": "Burnt American Cheese Cake",
      "category": "Desserts",
      "price": 50.0,
      "description": "Burnt cheesecake, inspired by both Basque and traditional American cheesecakes, features a caramelized dark top created by baking the cheesecake at a high temperature. The interior remains creamy and smooth, contrasting with the slightly burnt surface and subtle bitterness.",
      "icon": "🍰",
      "available": true
    },
    {
      "id": "item-19",
      "name": "Kunafa",
      "category": "Desserts",
      "price": 99.0,
      "description": "A kunafa plate is a specially designed cooking and serving pan, usually made from high-quality aluminum, ideal for preparing and presenting Middle Eastern desserts like kunafa or knafeh, ensuring even cooking and elegant serving.",
      "icon": "🍮",
      "available": true
    }
  ];
  // Step 15.2: the menu is read from MySQL, not from the browser seed.
  // Keep the existing view model so the HTML and CSS remain unchanged.
  async function syncMenuFromBackend() {
    try {
      const result = await apiRequest('/menu');
      const rows = Array.isArray(result) ? result
        : [result.data, result.items, result.menu, result.data?.items, result.data?.menu]
          .find(Array.isArray);
      if (!rows) throw new Error('Unexpected menu API response format');

      const existing = loadState();
      const iconsByName = new Map(SEED_MENU.map(item => [item.name.toLowerCase(), item.icon]));
      const menu = rows.map(row => {
        const numericId = Number(row.item_id ?? row.id);
        const price = row.price == null ? null : Number(row.price);
        if (!Number.isSafeInteger(numericId) || numericId < 1 ||
          !Number.isFinite(price) || price < 0) {
          throw new Error('Invalid item ID or price returned from MySQL');
        }
        const name = String(row.item_name ?? row.name ?? 'Unnamed item');
        const availableRaw = row.is_available ?? row.available ?? 1;
        return {
          id: `item-${numericId}`,
          name,
          category: String(row.category ?? 'Main Course'),
          price,
          description: String(row.description ?? ''),
          icon: row.icon || iconsByName.get(name.toLowerCase()) || '🍽️',
          available: availableRaw === true || availableRaw === 1 || availableRaw === '1'
        };
      });
      if (new Set(menu.map(item => item.id)).size !== menu.length) {
        throw new Error('Duplicate menu item IDs returned from MySQL');
      }
      existing.menu = menu;
      saveState(existing);

      // Reprice draft cart rows against the current MySQL menu.
      // The server will independently calculate authoritative totals at checkout.
      const currentMenu = new Map(menu.filter(x => x.available).map(x => [x.id, x]));
      const updatedCart = loadCart().flatMap(row => {
        const item = currentMenu.get(row.id);
        return item ? [{ ...row, name: item.name, price: item.price }] : [];
      });
      saveCart(updatedCart);
      return true;
    } catch (error) {
      // Fail closed instead of displaying or selling stale local prices.
      const state = loadState();
      state.menu = [];
      saveState(state);
      saveCart([]);
      console.error('Yumio menu sync:', error);
      showToast(`Menu unavailable: ${error.message}`);
      return false;
    }
  }

  const TABLE_CAPACITIES = [2, 2, 4, 4, 4, 6, 2, 4, 6, 4];
  const PUBLIC_SCREENS = new Set(['login', 'forgot-password', 'reset-sent', 'register']);
  const CUSTOMER_SCREENS = new Set([
    'customer-home', 'reserve', 'reservation-details', 'reservation-confirmation', 'scan-table', 'table-connected',
    'menu-breakfast', 'menu-startar', 'menu-main-course', 'menu-desserts', 'cart', 'orders', 'order-confirmation',
    'order-tracking', 'service-requests', 'service-request-sent', 'bill', 'payment', 'payment-success', 'profile',
    'customer-history', 'my-reservations', 'item-dynamic', ...Array.from({ length: 19 }, (_, i) => `item-${i + 1}`)
  ]);
  let toastTimer = null;

  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const money = value => { const n = Number(value || 0); return `MVR ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
  const screenId = () => (location.hash || '#login').slice(1);
  const categoryHash = c => ({ Breakfast: '#menu-breakfast', Startar: '#menu-startar', 'Main Course': '#menu-main-course', Desserts: '#menu-desserts' }[c] || '#menu-breakfast');
  const formatDate = value => { if (!value) return '—'; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const nowLabel = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const nextId = (prefix, list) => { const n = list.reduce((m, x) => Math.max(m, Number((String(x.id || '').match(/(\d+)$/) || [])[1] || 0)), 0) + 1; return `${prefix}-${String(n).padStart(4, '0')}`; };

  function freshState() {
    return {
      version: 7,
      menu: JSON.parse(JSON.stringify(SEED_MENU)), reservations: [], orders: [], serviceRequests: [], payments: [],
      tables: TABLE_CAPACITIES.map((capacity, index) => ({ id: String(index + 1).padStart(2, '0'), capacity, status: 'Available', reservationId: null, customerEmail: null })),
      customerTableId: null, selectedReservationId: null, selectedOrderId: null, selectedMenuItemId: null
    };
  }
  function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { const s = freshState(); saveState(s); return s; } const s = JSON.parse(raw); if (!s || s.version !== 7) { const n = freshState(); saveState(n); return n; } return s; } catch { const s = freshState(); saveState(s); return s; } }
  function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function currentSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  function setSession(value) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }
  function roleHome(role) { return { customer: '#customer-home', admin: '#manager-dashboard', kitchen: '#kitchen-dashboard', staff: '#staff-dashboard' }[role] || '#login'; }

  function showToast(message) {
    const toast = document.getElementById('yumio-toast'); if (!toast) return;
    toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function allowedForRole(id, role) {
    if (PUBLIC_SCREENS.has(id)) return true;
    if (role === 'customer') return CUSTOMER_SCREENS.has(id);
    if (role === 'admin') return id.startsWith('manager-');
    if (role === 'kitchen') return id.startsWith('kitchen-');
    if (role === 'staff') return id.startsWith('staff-');
    return false;
  }
  function guardRoute() {
    const id = screenId(); if (PUBLIC_SCREENS.has(id)) return true;
    const session = currentSession();
    if (!session) { if (location.hash !== '#login') location.hash = '#login'; return false; }
    if (!allowedForRole(id, session.role)) { showToast('That page is not available for this user role.'); location.hash = roleHome(session.role); return false; }
    return true;
  }

  function initLogin() {
    const form = document.getElementById('login-form'), email = document.getElementById('login-email'), password = document.getElementById('login-password'), error = document.getElementById('login-error'), toggle = document.getElementById('toggle-password');
    const clearError = () => { if (error) { error.textContent = ''; error.style.display = 'none'; } };
    const showError = m => { if (error) { error.textContent = m; error.style.display = 'block'; } };
    toggle?.addEventListener('click', () => { const visible = password.type === 'text'; password.type = visible ? 'password' : 'text'; toggle.textContent = visible ? 'SHOW' : 'HIDE'; });
    form?.addEventListener('submit', async e => {
      e.preventDefault(); clearError();
      const mail = email.value.trim().toLowerCase(), pass = password.value;
      if (!mail || !pass) return showError('Please enter both email and password.');
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const result = await apiRequest('/auth/login', {
          method: 'POST', body: JSON.stringify({ email: mail, password: pass })
        });
        const user = result.user || result.data?.user || result.data;
        if (!user || !user.role) throw new Error('Login response is missing user role. Check authRoutes.js response format.');
        setSession({ id: user.id ?? user.user_id, email: user.email || mail, role: user.role, name: user.name || user.full_name || mail });
        form.reset(); password.type = 'password'; if (toggle) toggle.textContent = 'SHOW';
        if (user.role === 'customer') await refreshReservationsWithNotice();
        if (user.role === 'staff') await refreshStaffPendingWithNotice();
        location.hash = roleHome(user.role);
        renderAll();
      } catch (err) { showError(err.message || 'Unable to sign in'); }
      finally { if (submit) submit.disabled = false; }
    });
    email?.addEventListener('input', clearError); password?.addEventListener('input', clearError);
    document.addEventListener('click', e => {
      const link = e.target.closest('.prototype-screen:not(#login) a[href="#login"]');
      if (!link) return;
      clearSession();
      reservationsSynchronized = false;
      apiRequest('/auth/logout', { method: 'POST' }).catch(() => { });
      form?.reset(); clearError(); if (password) password.type = 'password'; if (toggle) toggle.textContent = 'SHOW';
    });
  }

  // Step 15.3: MySQL is the authoritative reservation source.
  const reservationStatusLabel = value => ({
    pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked In',
    dining_done: 'Dining Complete', completed: 'Completed', cancelled: 'Cancelled'
  })[value] || value;
  const localDateString = value => {
    if (!value) return '';
    // MySQL DATE may serialize as ISO timestamp; preserve calendar date.
    return String(value).slice(0, 10);
  };
  const normalizeReservation = row => ({
    id: String(row.reservation_id),
    customerEmail: currentSession()?.email || '',
    customerName: currentSession()?.name || 'Customer',
    date: localDateString(row.reservation_date),
    time: String(row.reservation_time || '').slice(0, 5),
    guests: Number(row.guest_count),
    tableId: String(row.table_number).padStart(2, '0'),
    request: row.special_requests || '',
    status: reservationStatusLabel(row.status),
    fromBackend: true
  });
  let reservationsSynchronized = false;
  async function syncCustomerReservations() {
    if (currentSession()?.role !== 'customer') return;
    const result = await apiRequest('/reservations/my');
    if (!Array.isArray(result.data)) throw new Error('Unexpected reservation API response');
    const s = loadState();
    s.reservations = result.data.map(normalizeReservation);
    // Never let stale prototype state masquerade as database table occupancy.
    s.customerTableId = null;
    s.tables.forEach(t => { t.status = 'Available'; t.reservationId = null; t.customerEmail = null; });
    const active = s.reservations.find(r => r.status === 'Checked In');
    if (active) {
      s.customerTableId = active.tableId;
      const table = s.tables.find(t => t.id === active.tableId);
      if (table) { table.status = 'Occupied'; table.reservationId = active.id; table.customerEmail = active.customerEmail; }
    }
    saveState(s);
    reservationsSynchronized = true;
    renderAll();
  }
  async function refreshReservationsWithNotice() {
    try { await syncCustomerReservations(); }
    catch (err) { showToast(`Reservations not refreshed: ${err.message}`); }
  }
  function to24Hour(time) {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || '');
    if (!match) throw new Error('Invalid reservation time');
    const hour = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    return `${String(hour).padStart(2, '0')}:${match[2]}`;
  }
  function displayTime24h(time) {
    if (!/^\d{2}:\d{2}$/.test(time)) return time;
    const [h, m] = time.split(':').map(Number);
    return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  function reservationDraft() { try { return JSON.parse(localStorage.getItem(RESERVATION_DRAFT_KEY) || 'null'); } catch { return null; } }

  function tableIsBookedForSlot(state, tableId, date, time, ignoreReservationId = null) {
    return state.reservations.some(r =>
      r.id !== ignoreReservationId &&
      r.tableId === tableId &&
      r.date === date &&
      r.time === time &&
      !['Cancelled', 'Completed'].includes(r.status)
    );
  }

  function availableTablesForReservation(state, date, time, guests, ignoreReservationId = null) {
    if (!date || !time || !guests) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(`${date}T00:00:00`);
    const isToday = !Number.isNaN(chosenDate.getTime()) && chosenDate.getTime() === today.getTime();

    return state.tables.filter(t => {
      if (tableIsBookedForSlot(state, t.id, date, time, ignoreReservationId)) return false;
      if (isToday && ['Occupied', 'Awaiting Bill'].includes(t.status)) return false;
      return true;
    });
  }

  function getPreferredReservationTime() {
    const hourRaw = document.getElementById('reservation-hour')?.value || '';
    const minute = document.getElementById('reservation-minute')?.value || '';
    const period = document.getElementById('reservation-period')?.value || '';
    const hour = Number(hourRaw);

    if (!hourRaw || hour < 1 || hour > 12 || !minute || !period) return '';
    return `${hour}:${minute} ${period}`;
  }

  function updateReservationTableOptions() {
    const select = document.getElementById('reservation-table');
    if (!select) return;

    const date = document.getElementById('reservation-date')?.value || '';
    const guests = Number(document.getElementById('reservation-guests')?.value || 0);
    const time = getPreferredReservationTime();
    const current = select.value;

    if (!date || !guests || !time) {
      select.disabled = true;
      select.innerHTML = '<option value="">Choose date, guests and preferred time first</option>';
      return;
    }

    const tables = loadState().tables.filter(t => t.capacity >= guests);
    // Availability is finally validated by MySQL on submission.
    select.disabled = false;

    if (!tables.length) {
      select.innerHTML = '<option value="">No tables available for this time</option>';
      return;
    }

    select.innerHTML = '<option value="">Select a table</option>' + tables.map(t =>
      `<option value="${esc(t.id)}">Table ${esc(t.id)}</option>`
    ).join('');

    if (tables.some(t => t.id === current)) select.value = current;
  }

  function initReservation() {
    ['reservation-date', 'reservation-guests', 'reservation-hour', 'reservation-minute', 'reservation-period'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', updateReservationTableOptions);
    });

    document.getElementById('review-reservation')?.addEventListener('click', e => {
      e.preventDefault();
      const date = document.getElementById('reservation-date')?.value;
      const guests = Number(document.getElementById('reservation-guests')?.value || 0);
      const time = getPreferredReservationTime();
      const tableId = document.getElementById('reservation-table')?.value || '';
      const request = document.getElementById('reservation-request')?.value.trim() || '';

      if (!date || !guests || !time) return showToast('Please select a date, number of guests and time.');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(`${date}T00:00:00`) < today) return showToast('Please choose today or a future date.');
      if (!tableId) return showToast('Please choose an available table.');

      const state = loadState();
      const selected = state.tables.find(t => t.id === tableId && t.capacity >= guests);
      if (!selected) {
        updateReservationTableOptions();
        return showToast('That table is no longer available for the selected time. Please choose another table.');
      }

      localStorage.setItem(RESERVATION_DRAFT_KEY, JSON.stringify({ date, guests, time, tableId, request }));
      renderReservationDetails();
      location.hash = '#reservation-details';
    });

    document.getElementById('reservation-details')?.addEventListener('click', e => {
      const b = e.target.closest('[data-action="confirm-reservation"]');
      if (b) { e.preventDefault(); confirmReservation(); }
    });

    // Cancellation is deliberately disabled until an authenticated backend
    // cancellation endpoint exists. No browser-only changes to reservations.
  }

  function renderReservationDetails() {
    const draft = reservationDraft(), card = document.querySelector('#reservation-details section.card');
    if (!card) return;
    const actions = card.querySelector('.actions');
    card.querySelector('.empty')?.remove();
    let body = card.querySelector('.reservation-live-details');
    if (!body) {
      body = document.createElement('div');
      body.className = 'reservation-live-details';
      card.insertBefore(body, actions);
    }
    if (!draft) {
      body.innerHTML = '<div class="empty">No reservation is ready for review.</div>';
      return;
    }

    body.innerHTML = `<div class="dynamic-stack">
      <div class="dynamic-row"><strong>Date</strong><span>${esc(formatDate(draft.date))}</span></div>
      <div class="dynamic-row"><strong>Guests</strong><span>${draft.guests}</span></div>
      <div class="dynamic-row"><strong>Time</strong><span>${esc(draft.time)}</span></div>
      <div class="dynamic-row"><strong>Table</strong><span>Table ${esc(draft.tableId)}</span></div>
      <div class="dynamic-row"><strong>Special request</strong><span>${esc(draft.request || 'None')}</span></div>
    </div>`;
    actions.innerHTML = '<a class="btn btn-secondary" href="#reserve">Back to Reservation</a><a class="btn btn-dark" href="#reservation-confirmation" data-action="confirm-reservation">Confirm Reservation</a>';
  }

  function confirmReservation() {
    if (confirmReservation.inFlight) return;
    const draft = reservationDraft();
    if (!draft) return showToast('Complete the reservation form first.');
    confirmReservation.inFlight = true;
    (async () => {
      try {
        const payload = {
          table_id: Number(draft.tableId),
          reservation_date: draft.date,
          reservation_time: to24Hour(draft.time),
          guest_count: Number(draft.guests),
          special_requests: draft.request || ''
        };
        const result = await apiRequest('/reservations', {
          method: 'POST', body: JSON.stringify(payload)
        });
        localStorage.removeItem(RESERVATION_DRAFT_KEY);
        await syncCustomerReservations();
        const s = loadState();
        s.selectedReservationId = String(result.reservation_id);
        saveState(s);
        renderAll();
        location.hash = '#reservation-confirmation';
        showToast('Reservation sent to staff for approval.');
      } catch (err) {
        showToast(`Reservation not confirmed: ${err.message}`);
        // Preserve draft for retry. If request succeeded but refresh failed,
        // verify My Reservations before submitting again.
      } finally { confirmReservation.inFlight = false; }
    })();
  }

  function renderReservationConfirmation() {
    const s = loadState(),
      r = s.reservations.find(x => x.id === s.selectedReservationId && x.customerEmail === currentSession()?.email) || [...s.reservations].reverse().find(x => x.customerEmail === currentSession()?.email),
      card = document.querySelector('#reservation-confirmation section.card');
    if (!card) return;
    const empty = card.querySelector('.empty');
    const actions = card.querySelector('.actions');
    if (!empty || !actions) return;

    empty.innerHTML = r
      ? `<strong>${esc(r.id)}</strong><br>${esc(formatDate(r.date))} at ${esc(displayTime24h(r.time))} · ${r.guests} guest${r.guests === 1 ? '' : 's'}<br>Reserved table: <strong>Table ${esc(r.tableId)}</strong><br>Status: <strong>${esc(r.status)}</strong><br><span class="meta">Staff confirms the reservation. When it is confirmed and you arrive, you can check in directly from your customer account.</span>`
      : 'No reservation has been created yet.';

    actions.innerHTML = '<a class="btn btn-dark" href="#customer-home">Back Home</a><a class="btn btn-secondary" href="#reserve">Reservations</a>' +
      (r?.status === 'Confirmed' ? `<button class="btn btn-primary dynamic-btn" data-customer-checkin="${esc(r.id)}">Check In</button>` : '');
  }

  async function customerCheckIn(reservationId) {
    if (customerCheckIn.inFlight) return;
    customerCheckIn.inFlight = true;
    try {
      const result = await apiRequest(`/reservations/${encodeURIComponent(reservationId)}/check-in`, { method: 'PATCH' });
      await syncCustomerReservations();
      location.hash = '#table-connected';
      showToast(`Check-in successful. ${result.preorders_released || 0} pre-orders released to kitchen.`);
    } catch (err) {
      showToast(`Check-in failed: ${err.message}`);
    } finally { customerCheckIn.inFlight = false; }
  }

  async function markCustomerDiningDone() {
    const s = loadState();
    const active = s.reservations.find(r => r.status === 'Checked In' && r.customerEmail === currentSession()?.email);
    if (!active) return showToast('Check in to your confirmed reservation first.');
    try {
      await apiRequest(`/reservations/${encodeURIComponent(active.id)}/dining-done`, { method: 'PATCH' });
      await syncCustomerReservations();
      showToast('Dining marked as done. Final payment is now due.');
      location.hash = '#bill';
    } catch (err) { showToast(err.message); }
  }

  function renderCustomerReservations() {
    const s = loadState(), target = document.getElementById('my-reservations-list');
    if (!target) return;

    const draft = reservationDraft();
    const reservations = [...s.reservations]
      .filter(x => x.customerEmail === currentSession()?.email)
      .reverse();

    let html = `<div class="section-head">
      <h2>Your Reservations</h2>
      <a class="btn btn-primary" href="#reserve">New Reservation</a>
    </div>`;

    if (draft) {
      html += `<div class="card reservation-draft-card">
        <div class="section-head">
          <div>
            <strong>Reservation not submitted yet</strong>
            <div class="meta">${esc(formatDate(draft.date))} at ${esc(draft.time)} · ${draft.guests} guest${draft.guests === 1 ? '' : 's'} · Table ${esc(draft.tableId)}</div>
          </div>
          <span class="status">Draft</span>
        </div>
        <p class="muted">You can continue this reservation even if you left the reservation screen.</p>
        <div class="actions">
          <a class="btn btn-secondary" href="#reserve">Edit</a>
          <button class="btn btn-dark dynamic-btn" data-reservation-action="continue-draft">Continue & Confirm</button>
          <button class="btn btn-secondary dynamic-btn" data-reservation-action="discard-draft">Discard Draft</button>
        </div>
      </div>`;
    }

    if (!reservations.length) {
      html += draft ? '' : '<div class="empty">No reservations yet.</div>';
    } else {
      html += `<div class="dynamic-stack">${reservations.map(r => {
        let actions = '';
        let note = '';

        if (r.status === 'Pending') {
          note = 'Waiting for staff confirmation.';
          actions = `<button class="btn btn-secondary dynamic-btn" data-reservation-action="view" data-id="${esc(r.id)}">View Status</button>
`;
        } else if (r.status === 'Confirmed') {
          note = 'Your reservation is confirmed. Check in when you arrive.';
          actions = `<button class="btn btn-secondary dynamic-btn" data-reservation-action="view" data-id="${esc(r.id)}">View Status</button>
                   <button class="btn btn-dark dynamic-btn" data-reservation-action="checkin" data-id="${esc(r.id)}">Check In</button>
`;
        } else if (r.status === 'Checked In') {
          note = `You are checked in${r.tableId ? ` at Table ${esc(r.tableId)}` : ''}.`;
          actions = `<a class="btn btn-secondary" href="#table-connected">View Table Status</a>
                   <a class="btn btn-primary" href="#menu-breakfast">Browse Menu</a>
                   <a class="btn btn-secondary" href="#orders">Orders</a>`;
        } else if (r.status === 'Dining Complete') {
          note = 'Dining marked as done. Waiting for staff to make the table available.';
          actions = `<a class="btn btn-secondary" href="#customer-history">View History</a>`;
        } else if (r.status === 'Completed') {
          note = 'This reservation has been completed.';
          actions = `<a class="btn btn-secondary" href="#customer-history">View History</a>`;
        } else if (r.status === 'Cancelled') {
          note = 'This reservation was cancelled.';
          actions = `<a class="btn btn-secondary" href="#customer-history">View History</a>`;
        }

        return `<div class="card">
          <div class="section-head">
            <div>
              <strong>${esc(r.id)} · ${esc(formatDate(r.date))} at ${esc(displayTime24h(r.time))}</strong>
              <div class="meta">${r.guests} guest${r.guests === 1 ? '' : 's'} · Table ${esc(r.tableId)}</div>
            </div>
            <span class="status">${esc(r.status)}</span>
          </div>
          ${r.request ? `<p class="muted">${esc(r.request)}</p>` : ''}
          ${note ? `<p class="muted">${note}</p>` : ''}
          ${actions ? `<div class="actions">${actions}</div>` : ''}
        </div>`;
      }).join('')}</div>`;
    }

    target.innerHTML = html;

    target.querySelectorAll('[data-reservation-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.reservationAction;

        if (action === 'continue-draft') {
          renderReservationDetails();
          location.hash = '#reservation-details';
          return;
        }

        if (action === 'discard-draft') {
          localStorage.removeItem(RESERVATION_DRAFT_KEY);
          renderAll();
          showToast('Reservation draft discarded.');
          return;
        }

        const id = button.dataset.id;
        if (!id) return;

        const st = loadState();
        const reservation = st.reservations.find(x => x.id === id && x.customerEmail === currentSession()?.email);
        if (!reservation) return;

        st.selectedReservationId = id;
        saveState(st);

        if (action === 'view') {
          renderReservationConfirmation();
          location.hash = '#reservation-confirmation';
          return;
        }

        if (action === 'checkin') {
          customerCheckIn(id);
          return;
        }

        // Cancellation will be added after the backend supports it.
      });
    });
  }

  function initTables() {
    document.getElementById('connect-table-form')?.addEventListener('submit', e => {
      e.preventDefault();
      showToast('Please check in using a confirmed MySQL reservation.');
      location.hash = '#my-reservations';
    });

    document.addEventListener('click', e => {
      const checkin = e.target.closest('[data-customer-checkin]');
      if (checkin) {
        e.preventDefault();
        customerCheckIn(checkin.dataset.customerCheckin);
        return;
      }
      const done = e.target.closest('[data-action="customer-dining-done"]');
      if (done) {
        e.preventDefault();
        markCustomerDiningDone();
      }
    });
  }

  function updateCustomerTableUI() {
    const s = loadState(), t = s.tables.find(x => x.id === s.customerTableId);
    const label = t ? (t.status === 'Dining Done' ? `Table ${t.id} · Done` : `Table ${t.id}`) : 'No table';
    CUSTOMER_SCREENS.forEach(id => document.getElementById(id)?.querySelectorAll('.table-pill').forEach(p => p.textContent = label));

    const home = document.getElementById('customer-home');
    const homeBanner = home?.querySelector('.scan-banner');
    if (homeBanner) {
      const b = homeBanner.querySelector('b'), m = homeBanner.querySelector('.muted'), a = homeBanner.querySelector('a,button');
      if (t) {
        if (b) b.textContent = t.status === 'Dining Done' ? `Dining completed at Table ${t.id}` : `Checked in at Table ${t.id}`;
        if (m) m.textContent = t.status === 'Dining Done' ? 'Waiting for staff to make the table available.' : 'You can order, request service, and mark your dining session done when you leave.';
        if (a) { a.textContent = 'View Table'; a.setAttribute('href', '#table-connected'); a.removeAttribute('data-action'); }
      } else {
        if (b) b.textContent = 'Already at the restaurant?';
        if (m) m.textContent = 'If you have a confirmed reservation, check in from Reservations. Walk-in customers can connect with a table code.';
        if (a) { a.textContent = 'Connect Table'; a.setAttribute('href', '#scan-table'); a.removeAttribute('data-action'); }
      }
    }

    const cats = { 'menu-breakfast': 'Breakfast', 'menu-startar': 'Startar', 'menu-main-course': 'Main Course', 'menu-desserts': 'Desserts' };
    Object.entries(cats).forEach(([id, cat]) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      const g = sec.querySelector('.app-header .greeting');
      if (g) g.textContent = t ? `${cat} · Table ${t.id}` : `${cat} · No table`;
      const banner = sec.querySelector('.scan-banner');
      if (banner) {
        const b = banner.querySelector('b'), m = banner.querySelector('.muted');
        if (b) b.textContent = t ? (t.status === 'Dining Done' ? `Dining completed at Table ${t.id}` : `Connected to Table ${t.id}`) : 'No table connected';
        if (m) m.textContent = t
          ? (t.status === 'Dining Done' ? 'Staff will make the table available shortly.' : 'You can place a dine-in order from this table.')
          : 'Reservations do not require a QR code. Check in from your customer account after staff confirms your reservation.';
      }
    });
  }

  function renderTableConnected() {
    const s = loadState(), e = document.querySelector('#table-connected .empty'), actions = document.querySelector('#table-connected .actions');
    if (!e || !actions) return;
    const t = s.tables.find(x => x.id === s.customerTableId);
    if (!t) {
      e.innerHTML = 'No table is currently connected.';
      actions.innerHTML = '<a class="btn btn-dark" href="#scan-table">Connect to a Table</a><a class="btn btn-secondary" href="#reserve">Reservations</a>';
      return;
    }

    if (t.status === 'Dining Done') {
      e.innerHTML = `<strong>Dining completed at Table ${esc(t.id)}</strong><br>Staff has been notified that the table can be made available.`;
      actions.innerHTML = '<a class="btn btn-secondary" href="#customer-home">Back Home</a>';
      return;
    }

    e.innerHTML = `<strong>Checked in to Table ${esc(t.id)}</strong><br>You can place dine-in orders and send service requests. When you finish dining, mark the session as done.`;
    actions.innerHTML = '<a class="btn btn-secondary" href="#menu-breakfast">Browse Menu</a><button class="btn btn-dark dynamic-btn" data-action="customer-dining-done">Mark Dining Done</button>';
  }

  function renderMenuScreens() {
    const s = loadState(), map = { 'menu-breakfast': 'Breakfast', 'menu-startar': 'Startar', 'menu-main-course': 'Main Course', 'menu-desserts': 'Desserts' };
    Object.entries(map).forEach(([screen, category]) => {
      const sec = document.getElementById(screen), grid = sec?.querySelector('.food-grid'); if (!grid) return; const items = s.menu.filter(x => x.category === category && x.available); grid.innerHTML = items.length ? items.map(item => `<article class="food" data-item-id="${esc(item.id)}"><div class="food-visual">${esc(item.icon || '🍽️')}</div><div class="food-body"><div class="food-title">${esc(item.name)}</div><div class="food-desc">${esc(item.description || '')}</div><div class="food-bottom"><span class="price">${item.price == null ? 'Price TBC' : money(item.price)}</span>${item.price == null ? '<span class="circle-btn disabled" aria-label="Price to be confirmed">×</span>' : `<a class="circle-btn" href="${/^item-\d+$/.test(item.id) ? '#' + item.id : '#item-dynamic'}" data-menu-item-id="${esc(item.id)}" aria-label="Open ${esc(item.name)}">+</a>`}</div></div></article>`).join('') : '<div class="empty">No available items in this category.</div>';
      const search = sec.querySelector('input'); if (search && !search.dataset.bound) { search.dataset.bound = '1'; search.addEventListener('input', () => { const q = search.value.trim().toLowerCase(); grid.querySelectorAll('article.food').forEach(card => card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none'); }); }
    });
    document.querySelectorAll('[data-menu-item-id]').forEach(link => link.onclick = () => { const st = loadState(); st.selectedMenuItemId = link.dataset.menuItemId; saveState(st); }); updateCartSummary();
  }
  function renderItemPage(id) {
    const s = loadState(), itemId = id === 'item-dynamic' ? s.selectedMenuItemId : id, item = s.menu.find(x => x.id === itemId), sec = document.getElementById(id); if (!item || !sec) return; const card = sec.querySelector('section.card');
    const set = (sel, text) => { const el = sec.querySelector(sel); if (el) el.textContent = text; }; set('.app-header .greeting', item.category); set('.app-header h1', item.name); set('.item-art', item.icon || '🍽️'); if (card) { const e = card.querySelector('.eyebrow'), h1 = card.querySelector('h1'), h3 = card.querySelector('h3'), p = card.querySelector('p'), sel = card.querySelector('select'), ta = card.querySelector('textarea'), a = card.querySelector('.actions'); if (e) e.textContent = item.category; if (h1) h1.textContent = item.name; if (h3) h3.textContent = item.price == null ? 'Price TBC' : money(item.price); if (p) p.textContent = item.description || ''; if (sel) sel.value = '1'; if (ta) ta.value = ''; if (a) a.innerHTML = item.price == null ? `<span class="btn btn-secondary btn-block disabled">Price to be confirmed</span><a class="btn btn-secondary btn-block" href="${categoryHash(item.category)}">Back to Menu</a>` : `<a class="btn btn-primary btn-block" href="#cart" data-action="add-to-cart" data-id="${esc(item.id)}">Add to Cart</a><a class="btn btn-secondary btn-block" href="${categoryHash(item.category)}">Back to Menu</a>`; }
  }
  function initCart() {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-action="add-to-cart"]'); if (add) { e.preventDefault(); const s = loadState(), item = s.menu.find(x => x.id === add.dataset.id), sec = add.closest('.prototype-screen'), qty = Number(sec?.querySelector('select')?.value || 1), notes = sec?.querySelector('textarea')?.value.trim() || ''; if (!item || item.price == null || !item.available) return showToast('This item is not available to order.'); const cart = loadCart(), existing = cart.find(x => x.id === item.id && x.notes === notes); if (existing) existing.quantity += qty; else cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty, notes }); saveCart(cart); renderCart(); updateCartSummary(); showToast(`${item.name} added to cart.`); location.hash = '#cart'; return; }
      const c = e.target.closest('[data-cart-action]'); if (c) { const cart = loadCart(), i = Number(c.dataset.index); if (!cart[i]) return; if (c.dataset.cartAction === 'plus') cart[i].quantity++; if (c.dataset.cartAction === 'minus') cart[i].quantity = Math.max(1, cart[i].quantity - 1); if (c.dataset.cartAction === 'remove') cart.splice(i, 1); saveCart(cart); renderCart(); updateCartSummary(); return; }
      if (e.target.closest('[data-action="place-order"]')) { e.preventDefault(); placeOrder(); }
    });
  }
  function updateCartSummary() { const cart = loadCart(), count = cart.reduce((a, x) => a + Number(x.quantity || 0), 0), total = cart.reduce((a, x) => a + Number(x.price || 0) * Number(x.quantity || 0), 0);['menu-breakfast', 'menu-startar', 'menu-main-course', 'menu-desserts'].forEach(id => { const l = document.getElementById(id)?.querySelector('a[href="#cart"].btn-primary'); if (l) l.textContent = `View Cart · ${count} item${count === 1 ? '' : 's'} · ${money(total)}`; }); }
  function renderCart() { const cart = loadCart(), card = document.querySelector('#cart section.card'); if (!card) return; const total = cart.reduce((a, x) => a + x.price * x.quantity, 0); if (!cart.length) { card.innerHTML = '<div class="empty">Your cart is empty.</div><div class="total-row grand"><span>Total</span><span>MVR 0</span></div><div class="actions"><a class="btn btn-secondary" href="#menu-breakfast">Browse Menu</a></div>'; return; } card.innerHTML = `<div class="dynamic-stack">${cart.map((x, i) => `<div class="cart-item"><div><strong>${esc(x.name)}</strong><div class="meta">${money(x.price)} each${x.notes ? ` · ${esc(x.notes)}` : ''}</div></div><div class="cart-controls"><button class="btn btn-secondary dynamic-btn" data-cart-action="minus" data-index="${i}">−</button><strong>${x.quantity}</strong><button class="btn btn-secondary dynamic-btn" data-cart-action="plus" data-index="${i}">+</button><button class="btn btn-secondary dynamic-btn" data-cart-action="remove" data-index="${i}">Remove</button></div></div>`).join('')}</div><div class="total-row grand"><span>Total</span><span>${money(total)}</span></div><div class="actions"><a class="btn btn-secondary" href="#menu-breakfast">Continue Ordering</a><button class="btn btn-dark dynamic-btn" data-action="place-order">Place Order</button></div>`; }
  function placeOrder() {
    showToast('Online ordering will be connected in Step 15.4. No order has been submitted.');
    return;
    const cart = loadCart();
    if (!cart.length) return showToast('Your cart is empty.');

    const s = loadState();
    if (!s.customerTableId) {
      showToast('Check in or connect to your table before placing an order.');
      location.hash = '#my-reservations';
      return;
    }

    const activeTable = s.tables.find(t => t.id === s.customerTableId);
    if (!activeTable || activeTable.status !== 'Occupied') return showToast('This dining session is no longer active.');

    const activeReservation =
      s.reservations.find(r => r.id === activeTable.reservationId && r.customerEmail === currentSession()?.email) ||
      [...s.reservations].reverse().find(r =>
        r.customerEmail === currentSession()?.email &&
        r.tableId === s.customerTableId &&
        r.status === 'Checked In'
      );

    const id = nextId('ORD', s.orders);
    const total = cart.reduce((a, x) => a + x.price * x.quantity, 0);

    s.orders.push({
      id,
      customerEmail: 'shanku@yumio.test',
      customerName: 'Shanku',
      tableId: s.customerTableId,
      reservationId: activeReservation?.id || null,
      items: JSON.parse(JSON.stringify(cart)),
      total,
      status: 'Received',
      paid: false,
      createdAt: nowLabel()
    });

    s.selectedOrderId = id;
    saveState(s);
    saveCart([]);
    renderAll();
    location.hash = '#order-confirmation';
  }
  function renderOrderConfirmation() { const s = loadState(), o = s.orders.find(x => x.id === s.selectedOrderId) || s.orders.at(-1), e = document.querySelector('#order-confirmation .empty'); if (e) e.innerHTML = o ? `<strong>${esc(o.id)} placed successfully.</strong><br>${o.reservationId ? `Reservation ${esc(o.reservationId)} · ` : ''}Table ${esc(o.tableId)} · ${money(o.total)}<br>Status: <strong>${esc(o.status)}</strong>` : 'No order has been submitted yet.'; }
  function renderOrders() { const s = loadState(), target = document.querySelector('#orders section.section'); if (!target) return; if (!s.orders.length) { target.innerHTML = '<div class="empty">No orders have been placed yet.<div class="actions" style="justify-content:center"><a class="btn btn-primary" href="#menu-breakfast">Browse Menu</a></div></div>'; return; } target.innerHTML = `<div class="dynamic-stack">${[...s.orders].reverse().map(o => `<div class="card"><div class="section-head"><div><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${o.reservationId ? `Reservation ${esc(o.reservationId)} · ` : ''}${o.items.reduce((a, x) => a + x.quantity, 0)} items · ${money(o.total)} · ${esc(o.createdAt)}</div></div><span class="status">${esc(o.status)}</span></div><div class="actions"><button class="btn btn-secondary dynamic-btn" data-action="track-order" data-id="${esc(o.id)}">Track Order</button></div></div>`).join('')}</div>`; target.querySelectorAll('[data-action="track-order"]').forEach(b => b.addEventListener('click', () => { const st = loadState(); st.selectedOrderId = b.dataset.id; saveState(st); renderOrderTracking(); location.hash = '#order-tracking'; })); }
  function renderOrderTracking() { const s = loadState(), o = s.orders.find(x => x.id === s.selectedOrderId) || s.orders.at(-1), target = document.querySelector('#order-tracking section.section'); if (!target) return; if (!o) { target.innerHTML = '<div class="empty">There is no active order to track.</div>'; return; } const steps = ['Received', 'Accepted', 'Preparing', 'Ready', 'Served'], current = Math.max(0, steps.indexOf(o.status)); target.innerHTML = `<div class="card"><div class="section-head"><div><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${money(o.total)}</div></div><span class="status">${esc(o.status)}</span></div><div class="dynamic-stack">${steps.map((step, i) => `<div class="dynamic-row"><span>${i <= current ? '●' : '○'} ${esc(step)}</span><span>${i === current ? 'Current' : i < current ? 'Done' : ''}</span></div>`).join('')}</div></div>`; }

  function initServiceRequests() { document.querySelectorAll('#service-requests .grid-2 a.card').forEach(card => card.addEventListener('click', e => { e.preventDefault(); const s = loadState(); if (!s.customerTableId) { showToast('Check in or connect to a table before sending a service request.'); location.hash = '#reserve'; return; } const activeTable = s.tables.find(t => t.id === s.customerTableId); if (!activeTable || activeTable.status !== 'Occupied') return showToast('This dining session is no longer active.'); const title = card.querySelector('h3')?.textContent.trim().replace(/^\S+\s*/, '') || 'Other'; s.serviceRequests.push({ id: nextId('REQ', s.serviceRequests), customerEmail: 'shanku@yumio.test', tableId: s.customerTableId, type: title, status: 'Pending', createdAt: nowLabel() }); saveState(s); renderAll(); location.hash = '#service-request-sent'; })); }
  function renderServiceRequestSent() { const s = loadState(), r = s.serviceRequests.at(-1), e = document.querySelector('#service-request-sent .empty'); if (e) e.innerHTML = r ? `<strong>${esc(r.type)} request sent.</strong><br>Table ${esc(r.tableId)} · Status: ${esc(r.status)}` : 'No service request has been sent yet.'; }

  const unpaidOrders = s => s.orders.filter(o => !o.paid && o.customerEmail === 'shanku@yumio.test');
  function renderBill() { const s = loadState(), orders = unpaidOrders(s), card = document.querySelector('#bill section.card'); if (!card) return; const total = orders.reduce((a, o) => a + o.total, 0); if (!orders.length) { card.innerHTML = '<div class="empty">No bill is available yet.</div><div class="total-row grand"><span>Total</span><span>MVR 0</span></div><div class="actions"><a class="btn btn-secondary" href="#orders">Back to Orders</a></div>'; return; } card.innerHTML = `<div class="dynamic-stack">${orders.map(o => `<div class="dynamic-row"><span>${esc(o.id)}</span><strong>${money(o.total)}</strong></div>`).join('')}</div><div class="total-row grand"><span>Total</span><span>${money(total)}</span></div><div class="actions"><a class="btn btn-secondary" href="#orders">Back to Orders</a><button class="btn btn-dark dynamic-btn" data-action="request-bill">Request Bill</button></div>`; card.querySelector('[data-action="request-bill"]')?.addEventListener('click', () => { const st = loadState(), t = st.tables.find(x => x.id === st.customerTableId); if (t) t.status = 'Awaiting Bill'; saveState(st); renderAll(); location.hash = '#payment'; }); }
  function renderPayment() { const s = loadState(), orders = unpaidOrders(s), total = orders.reduce((a, o) => a + o.total, 0), card = document.querySelector('#payment section.card'); if (!card) return; if (!total) { card.innerHTML = '<div class="empty">There is no bill ready for payment.</div><div class="total-row grand"><span>Amount due</span><span>MVR 0</span></div><div class="actions"><a class="btn btn-secondary" href="#bill">Back to Bill</a></div>'; return; } card.innerHTML = `<div class="empty">Payment is simulated in this version.</div><div class="total-row grand"><span>Amount due</span><span>${money(total)}</span></div><div class="actions"><a class="btn btn-secondary" href="#bill">Back to Bill</a><button class="btn btn-dark dynamic-btn" data-action="pay-now">Pay Now</button></div>`; card.querySelector('[data-action="pay-now"]')?.addEventListener('click', () => { const st = loadState(), due = unpaidOrders(st), amount = due.reduce((a, o) => a + o.total, 0); due.forEach(o => o.paid = true); st.payments.push({ id: nextId('PAY', st.payments), customerEmail: 'shanku@yumio.test', amount, method: 'Simulated Card / Wallet', status: 'Paid', createdAt: nowLabel() }); saveState(st); renderAll(); location.hash = '#payment-success'; }); }
  function renderPaymentSuccess() { const s = loadState(), p = s.payments.at(-1), e = document.querySelector('#payment-success .empty'); if (e) e.innerHTML = p ? `<strong>Payment successful.</strong><br>${esc(p.id)} · ${money(p.amount)}<br>When you finish dining, open your table status and choose <strong>Mark Dining Done</strong>. Staff can then make the table available.` : 'No payment has been completed yet.'; }
  // Restore dashboard metric navigation from the original Yumio frontend.
  let staffViewFilter = null;
  document.addEventListener('click', event => {
    const metric = event.target.closest('#staff-dashboard [data-staff-filter]');
    if (metric) {
      staffViewFilter = metric.dataset.staffFilter;
      // Navigating to the same hash does not trigger hashchange.
      if (location.hash === metric.getAttribute('href')) renderAll();
      return;
    }
    const tab = event.target.closest('.admin-tabs a[href^="#staff-"]');
    if (tab) {
      staffViewFilter = null;
      if (location.hash === tab.getAttribute('href')) renderAll();
    }
  });
  function renderStaff() { renderStaffDashboard(); renderStaffReservations(); renderStaffCheckIn(); renderStaffTables(); renderStaffRequests(); }
  function renderStaffDashboard() { const s = loadState(), sec = document.getElementById('staff-dashboard'); if (!sec) return; const m = sec.querySelectorAll('.metric'), vals = [staffPendingReservations.length, s.tables.filter(x => x.status === 'Occupied').length, s.serviceRequests.filter(x => x.status === 'Pending').length, s.tables.filter(x => ['Awaiting Bill', 'Dining Done'].includes(x.status)).length]; m.forEach((x, i) => { const b = x.querySelector('b'); if (b) b.textContent = vals[i] ?? 0; }); const blocks = sec.querySelectorAll('section.section'); if (blocks[0]) { const list = s.reservations.filter(x => x.status !== 'Cancelled').slice(-4).reverse(); blocks[0].querySelector('.empty,.dynamic-stack')?.remove(); const d = document.createElement('div'); d.className = list.length ? 'dynamic-stack' : 'empty'; d.innerHTML = list.length ? list.map(x => `<div class="dynamic-row"><span><strong>${esc(x.id)}</strong><br><span class="meta">${esc(x.customerName)} · ${esc(formatDate(x.date))} ${esc(x.time)}</span></span><span class="status">${esc(x.status)}</span></div>`).join('') : 'No reservations.'; blocks[0].appendChild(d); } if (blocks[1]) { const list = s.serviceRequests.filter(x => x.status === 'Pending').slice(-4).reverse(); blocks[1].querySelector('.empty,.dynamic-stack')?.remove(); const d = document.createElement('div'); d.className = list.length ? 'dynamic-stack' : 'empty'; d.innerHTML = list.length ? list.map(x => `<div class="dynamic-row"><span><strong>${esc(x.type)}</strong><br><span class="meta">Table ${esc(x.tableId)} · ${esc(x.createdAt)}</span></span><span class="status">${esc(x.status)}</span></div>`).join('') : 'No service requests.'; blocks[1].appendChild(d); } }
  let staffPendingReservations = [];
  async function syncStaffPendingReservations() {
    if (!['staff', 'admin'].includes(currentSession()?.role)) return;
    const result = await apiRequest('/reservations/pending');
    if (!Array.isArray(result.data)) throw new Error('Unexpected pending reservations response');
    staffPendingReservations = result.data;
    renderStaffReservations();
  }
  async function refreshStaffPendingWithNotice() {
    try { await syncStaffPendingReservations(); }
    catch (err) { showToast(`Staff reservations not refreshed: ${err.message}`); }
  }
  function renderStaffReservations() {
    const target = document.querySelector('#staff-reservations section.section');
    if (!target) return;
    const list = staffPendingReservations;
    target.innerHTML = `<h2>Pending Reservations</h2><div class="actions"><button class="btn btn-secondary dynamic-btn" id="refresh-staff-reservations">Refresh Queue</button></div>` +
      (list.length ? `<div class="dynamic-stack">${list.map(r => `<div class="card"><div class="section-head"><div><strong>Reservation ${esc(r.reservation_id)} · ${esc(r.customer_name)}</strong><div class="meta">${esc(formatDate(localDateString(r.reservation_date)))} at ${esc(displayTime24h(String(r.reservation_time).slice(0, 5)))} · ${esc(r.guest_count)} guests · Table ${esc(r.table_number)}</div></div><span class="status">Pending</span></div>${r.special_requests ? `<p class="muted">${esc(r.special_requests)}</p>` : ''}<div class="actions"><button class="btn btn-primary dynamic-btn" data-staff-api-confirm="${esc(r.reservation_id)}">Confirm Reservation</button></div></div>`).join('')}</div>` : '<div class="empty">No pending reservations.</div>');
    target.querySelector('#refresh-staff-reservations')?.addEventListener('click', refreshStaffPendingWithNotice);
    target.querySelectorAll('[data-staff-api-confirm]').forEach(b => b.addEventListener('click', async () => {
      if (b.disabled) return;
      b.disabled = true;
      try {
        await apiRequest(`/reservations/${encodeURIComponent(b.dataset.staffApiConfirm)}/accept`, { method: 'PATCH' });
        showToast('Reservation confirmed in MySQL.');
        await syncStaffPendingReservations();
      } catch (err) { showToast(`Unable to confirm: ${err.message}`); b.disabled = false; }
    }));
  }

  function renderStaffCheckIn() {
    const target = document.querySelector('#staff-check-in section.section');
    if (!target) return;
    target.innerHTML = '<div class="empty"><strong>Customer-managed check-in</strong><br>Staff only confirms reservations. Once confirmed, the customer checks in from their own account.</div><div class="actions"><a class="btn btn-secondary" href="#staff-reservations">Back to Reservations</a></div>';
  }

  function releaseTableByStaff(tableId) {
    showToast('Table closure will be connected to MySQL in the staff integration step.');
    return;
    const st = loadState(), t = st.tables.find(x => x.id === tableId);
    if (!t) return;

    const linkedReservation = st.reservations.find(r => r.id === t.reservationId) || [...st.reservations].reverse().find(r =>
      r.tableId === t.id && r.customerEmail === t.customerEmail && ['Checked In', 'Dining Complete'].includes(r.status)
    );
    if (linkedReservation) {
      linkedReservation.status = 'Completed';
      linkedReservation.completedAt = nowLabel();
    }

    if (st.customerTableId === t.id) st.customerTableId = null;
    t.status = 'Available';
    t.reservationId = null;
    t.customerEmail = null;
    t.customerDoneAt = null;
    saveState(st);
    renderAll();
    showToast(`Table ${t.id} is now available.`);
  }

  function renderStaffTables() {
    const s = loadState(), grid = document.querySelector('#staff-tables .table-grid');
    if (!grid) return;
    const tables = staffViewFilter === 'occupied' ? s.tables.filter(t => t.status === 'Occupied') : staffViewFilter === 'bill' ? s.tables.filter(t => ['Awaiting Bill', 'Dining Done'].includes(t.status)) : s.tables;
    grid.innerHTML = tables.map(t => `<div class="table-card"><strong>Table ${esc(t.id)}</strong><div class="status-line"><span class="status">${esc(t.status)}</span><span class="meta">${t.capacity} seats</span></div><div class="meta">Code: <span class="code-chip">YUMIO-${esc(t.id)}</span></div><div class="actions"><button class="linkbtn dynamic-btn" data-show-code="${esc(t.id)}">View QR Code</button>${['Occupied', 'Awaiting Bill', 'Dining Done', 'Reserved'].includes(t.status) ? `<button class="btn btn-secondary dynamic-btn" data-release-table="${esc(t.id)}">${t.status === 'Dining Done' ? 'Make Available' : 'Mark Done & Make Available'}</button>` : ''}</div></div>`).join('');

    grid.querySelectorAll('[data-show-code]').forEach(b => b.addEventListener('click', () => showToast(`Table code: YUMIO-${b.dataset.showCode}`)));
    grid.querySelectorAll('[data-release-table]').forEach(b => b.addEventListener('click', () => releaseTableByStaff(b.dataset.releaseTable)));
  }

  function renderStaffRequests() { const s = loadState(), target = document.querySelector('#staff-requests section.section'); if (!target) return; const list = [...s.serviceRequests].filter(x => staffViewFilter !== 'pending' || x.status === 'Pending').reverse(); target.innerHTML = list.length ? `<div class="dynamic-stack">${list.map(x => `<div class="card"><div class="section-head"><div><strong>${esc(x.type)} · Table ${esc(x.tableId)}</strong><div class="meta">${esc(x.id)} · ${esc(x.createdAt)}</div></div><span class="status">${esc(x.status)}</span></div>${x.status === 'Pending' ? `<div class="actions"><button class="btn btn-dark dynamic-btn" data-complete-request="${esc(x.id)}">Mark Complete</button></div>` : ''}</div>`).join('')}</div>` : '<div class="empty">No service requests.</div>'; target.querySelectorAll('[data-complete-request]').forEach(b => b.addEventListener('click', () => { const st = loadState(), r = st.serviceRequests.find(x => x.id === b.dataset.completeRequest); if (r) r.status = 'Completed'; saveState(st); renderAll(); showToast('Service request completed.'); })); }

  function renderKitchen() { renderKitchenDashboard(); renderKitchenDetail(); }
  function renderKitchenDashboard() { const s = loadState(), board = document.querySelector('#kitchen-dashboard .kitchen-board'); if (!board) return; const cols = board.querySelectorAll('.kitchen-col'), groups = [s.orders.filter(o => ['Received', 'Accepted'].includes(o.status)), s.orders.filter(o => o.status === 'Preparing'), s.orders.filter(o => o.status === 'Ready')]; cols.forEach((col, i) => { const heading = col.querySelector('h2')?.outerHTML || ''; const list = groups[i]; col.innerHTML = heading + (list.length ? list.map(o => `<div class="kitchen-order"><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${o.items.reduce((a, x) => a + x.quantity, 0)} items · ${esc(o.status)}</div><div class="actions"><button class="btn btn-dark dynamic-btn" data-kitchen-order="${esc(o.id)}">Open</button></div></div>`).join('') : `<div class="empty">${i === 0 ? 'No new orders.' : i === 1 ? 'No orders preparing.' : 'No orders ready.'}</div>`); }); board.querySelectorAll('[data-kitchen-order]').forEach(b => b.addEventListener('click', () => { const st = loadState(); st.selectedOrderId = b.dataset.kitchenOrder; saveState(st); renderKitchenDetail(); location.hash = '#kitchen-order-detail'; })); }
  function renderKitchenDetail() { const s = loadState(), target = document.querySelector('#kitchen-order-detail section.section'), o = s.orders.find(x => x.id === s.selectedOrderId); if (!target) return; if (!o) { target.innerHTML = '<div class="empty">No kitchen order is selected.</div>'; return; } const next = { Received: ['Accepted', 'Accept Order'], Accepted: ['Preparing', 'Start Preparing'], Preparing: ['Ready', 'Mark Ready'], Ready: ['Served', 'Mark Served'] }[o.status]; target.innerHTML = `<div class="section-head"><div><h2>${esc(o.id)} · Table ${esc(o.tableId)}</h2><div class="meta">${esc(o.createdAt)}</div></div><span class="status">${esc(o.status)}</span></div><div class="dynamic-stack">${o.items.map(x => `<div class="dynamic-row"><span><strong>${esc(x.quantity)} × ${esc(x.name)}</strong>${x.notes ? `<br><span class="meta">${esc(x.notes)}</span>` : ''}</span><span>${money(x.price * x.quantity)}</span></div>`).join('')}</div>${next ? `<div class="actions"><button class="btn btn-dark dynamic-btn" data-next-order-status="${esc(next[0])}">${esc(next[1])}</button></div>` : '<div class="empty">This order has been served.</div>'}`; target.querySelector('[data-next-order-status]')?.addEventListener('click', e => { const st = loadState(), live = st.orders.find(x => x.id === o.id); if (live) live.status = e.currentTarget.dataset.nextOrderStatus; saveState(st); renderAll(); showToast(`Order ${o.id} updated.`); if (live?.status === 'Served') location.hash = '#kitchen-dashboard'; }); }

  function initManagerForms() {
    document.getElementById('manager-add-menu-form')?.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('add-item-name')?.value.trim(), price = Number(document.getElementById('add-item-price')?.value), category = document.getElementById('add-item-category')?.value, icon = document.getElementById('add-item-icon')?.value.trim() || '🍽️', description = document.getElementById('add-item-description')?.value.trim() || ''; if (!name || !Number.isFinite(price) || price <= 0 || !category) return showToast('Enter a valid item name, price and category.'); const s = loadState(); s.menu.push({ id: `custom-${Date.now()}`, name, price, category, icon, description, available: true }); saveState(s); e.currentTarget.reset(); document.getElementById('add-item-icon').value = '🍽️'; renderAll(); showToast('Menu item added.'); location.hash = '#manager-menu'; });
    document.getElementById('manager-edit-menu-form')?.addEventListener('submit', e => { e.preventDefault(); const s = loadState(), item = s.menu.find(x => x.id === s.selectedMenuItemId); if (!item) return showToast('Choose a menu item to edit.'); const name = document.getElementById('edit-item-name')?.value.trim(), price = Number(document.getElementById('edit-item-price')?.value), category = document.getElementById('edit-item-category')?.value, icon = document.getElementById('edit-item-icon')?.value.trim() || '🍽️', description = document.getElementById('edit-item-description')?.value.trim() || ''; if (!name || !Number.isFinite(price) || price <= 0 || !category) return showToast('Enter a valid item name, price and category.'); Object.assign(item, { name, price, category, icon, description }); saveState(s); renderAll(); showToast('Menu item updated.'); location.hash = '#manager-menu'; });
  }
  function renderManager() { renderManagerDashboard(); renderManagerMenu(); renderManagerHistory(); renderManagerEditForm(); }
  function renderManagerDashboard() { const s = loadState(), sec = document.getElementById('manager-dashboard'); if (!sec) return; const m = sec.querySelectorAll('.metric'), vals = [s.reservations.length, s.orders.length, money(s.payments.reduce((a, x) => a + x.amount, 0)), 1]; m.forEach((x, i) => { const b = x.querySelector('b'); if (b) b.textContent = vals[i] ?? 0; }); const snap = sec.querySelector('section.section'), sm = snap?.querySelectorAll('.metric'); if (sm?.length >= 3) { const avail = s.tables.filter(x => x.status === 'Available').length, occ = s.tables.filter(x => x.status === 'Occupied').length, res = s.tables.filter(x => x.status === 'Reserved').length, active = s.orders.filter(x => x.status !== 'Served').length, req = s.serviceRequests.filter(x => x.status === 'Pending').length; let b = sm[0].querySelector('b'), small = sm[0].querySelector('small'); if (b) b.textContent = s.tables.length; if (small) small.textContent = `${avail} available · ${occ} occupied · ${res} reserved`; b = sm[1].querySelector('b'); small = sm[1].querySelector('small'); if (b) b.textContent = active; if (small) small.textContent = active ? 'Active kitchen orders' : 'No active orders'; b = sm[2].querySelector('b'); small = sm[2].querySelector('small'); if (b) b.textContent = req; if (small) small.textContent = req ? 'Pending requests' : 'No pending requests'; } }
  function renderManagerMenu() { const s = loadState(), grid = document.querySelector('#manager-menu .menu-admin-grid'); if (!grid) return; grid.innerHTML = s.menu.map(item => `<div class="menu-admin-card ${item.available ? '' : 'menu-item-hidden'}"><div class="menu-admin-icon">${esc(item.icon || '🍽️')}</div><div><div class="section-head"><div><strong>${esc(item.name)}</strong><div class="meta">${esc(item.category)} · ${item.price == null ? 'Price TBC' : money(item.price)}</div></div><span class="status">${item.available ? 'Available' : 'Hidden'}</span></div><p class="muted">${esc(item.description || '')}</p><div class="actions"><button class="btn btn-outline dynamic-btn" data-menu-action="edit" data-id="${esc(item.id)}">Edit</button><button class="btn btn-secondary dynamic-btn" data-menu-action="toggle" data-id="${esc(item.id)}">${item.available ? 'Hide' : 'Show'}</button><button class="btn btn-secondary dynamic-btn" data-menu-action="remove" data-id="${esc(item.id)}">Remove</button></div></div></div>`).join(''); grid.querySelectorAll('[data-menu-action]').forEach(b => b.addEventListener('click', () => { const st = loadState(), item = st.menu.find(x => x.id === b.dataset.id); if (!item) return; const a = b.dataset.menuAction; if (a === 'edit') { st.selectedMenuItemId = item.id; saveState(st); renderManagerEditForm(); location.hash = '#manager-menu-edit'; return; } if (a === 'toggle') item.available = !item.available; if (a === 'remove') st.menu = st.menu.filter(x => x.id !== item.id); saveState(st); renderAll(); showToast(a === 'remove' ? 'Menu item removed.' : `Menu item ${item.available ? 'shown' : 'hidden'}.`); })); }
  function renderManagerEditForm() { const s = loadState(), item = s.menu.find(x => x.id === s.selectedMenuItemId); if (!item) return; const map = { 'edit-item-name': item.name, 'edit-item-price': item.price ?? '', 'edit-item-category': item.category, 'edit-item-icon': item.icon || '🍽️', 'edit-item-description': item.description || '' }; Object.entries(map).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; }); }
  function renderHistorySection(screen, heading, rows) { const sec = document.getElementById(screen), target = sec?.querySelector('section.section'); if (!target) return; const tabs = target.querySelector('.history-tabs')?.outerHTML || '', p = target.querySelector('p.meta')?.outerHTML || ''; target.innerHTML = `<h2>${esc(heading)}</h2>${p}${tabs}${rows.length ? `<div class="dynamic-stack" style="margin-top:18px">${[...rows].reverse().map(r => `<div class="card"><strong>${esc(r.title)}</strong><div class="meta">${esc(r.meta)}</div></div>`).join('')}</div>` : `<div class="empty" style="margin-top:18px">No ${esc(heading.toLowerCase())} history.</div>`}`; }
  function renderManagerHistory() { const s = loadState(); renderHistorySection('manager-history-orders', 'Orders', s.orders.map(o => ({ title: `${o.id} · Table ${o.tableId}`, meta: `${o.status} · ${money(o.total)} · ${o.createdAt}` }))); renderHistorySection('manager-history-reservations', 'Reservations', s.reservations.map(r => ({ title: `${r.id} · ${r.customerName}`, meta: `${formatDate(r.date)} ${r.time} · ${r.guests} guests · ${r.status}${r.tableId ? ` · Table ${r.tableId}` : ''}` }))); renderHistorySection('manager-history-payments', 'Payments', s.payments.map(p => ({ title: `${p.id} · ${money(p.amount)}`, meta: `${p.status} · ${p.method} · ${p.createdAt}` }))); renderHistorySection('manager-history-customers', 'Customers', [{ title: 'Shanku', meta: 'shanku@yumio.test · Customer' }]); renderHistorySection('manager-history-requests', 'Service Requests', s.serviceRequests.map(r => ({ title: `${r.id} · ${r.type}`, meta: `Table ${r.tableId} · ${r.status} · ${r.createdAt}` }))); }

  function renderCustomerHistory() {
    const s = loadState(), sec = document.getElementById('customer-history');
    if (!sec) return;

    const target = document.getElementById('reservation-order-history-list');
    if (target) {
      const reservations = [...s.reservations]
        .filter(r => r.customerEmail === currentSession()?.email)
        .reverse();

      const walkInOrders = s.orders.filter(o => o.customerEmail === 'shanku@yumio.test' && !o.reservationId);

      let html = '<h2>Reservation & Order History</h2>';

      if (!reservations.length && !walkInOrders.length) {
        html += '<div class="empty">No reservation or order history yet.</div>';
      } else {
        html += '<div class="dynamic-stack">';

        reservations.forEach(r => {
          const orders = s.orders.filter(o => o.customerEmail === 'shanku@yumio.test' && o.reservationId === r.id);
          html += `<div class="card history-reservation-card">
            <div class="section-head">
              <div>
                <strong>${esc(r.id)}</strong>
                <div class="meta">${esc(formatDate(r.date))} at ${esc(displayTime24h(r.time))} · ${r.guests} guest${r.guests === 1 ? '' : 's'} · Table ${esc(r.tableId)}</div>
              </div>
              <span class="status">${esc(r.status)}</span>
            </div>
            <div class="history-food-block">
              <h3>Food ordered during this reservation</h3>
              ${orders.length
              ? orders.map(o => `<div class="history-order-card">
                    <div class="section-head">
                      <div>
                        <strong>${esc(o.id)}</strong>
                        <div class="meta">${esc(o.createdAt)}</div>
                      </div>
                      <span class="status">${esc(o.status)}</span>
                    </div>
                    <div class="history-order-items">
                      ${o.items.map(item => `<div class="dynamic-row">
                        <span>${item.quantity} × ${esc(item.name)}</span>
                        <strong>${money(item.price * item.quantity)}</strong>
                      </div>`).join('')}
                    </div>
                    <div class="total-row grand"><span>Order total</span><span>${money(o.total)}</span></div>
                  </div>`).join('')
              : '<div class="empty compact-empty">No food orders were placed during this reservation.</div>'}
            </div>
          </div>`;
        });

        if (walkInOrders.length) {
          html += `<div class="card history-reservation-card">
            <div class="section-head">
              <div>
                <strong>Orders without a reservation</strong>
                <div class="meta">Walk-in dining orders</div>
              </div>
            </div>
            <div class="history-food-block">
              ${walkInOrders.map(o => `<div class="history-order-card">
                <div class="section-head">
                  <div>
                    <strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong>
                    <div class="meta">${esc(o.createdAt)}</div>
                  </div>
                  <span class="status">${esc(o.status)}</span>
                </div>
                <div class="history-order-items">
                  ${o.items.map(item => `<div class="dynamic-row">
                    <span>${item.quantity} × ${esc(item.name)}</span>
                    <strong>${money(item.price * item.quantity)}</strong>
                  </div>`).join('')}
                </div>
                <div class="total-row grand"><span>Order total</span><span>${money(o.total)}</span></div>
              </div>`).join('')}
            </div>
          </div>`;
        }

        html += '</div>';
      }

      target.innerHTML = html;
    }

    const profile = document.getElementById('profile');
    const historyMeta = profile?.querySelector('a[href="#customer-history"] .meta');
    if (historyMeta) {
      const count = s.reservations.filter(r => r.customerEmail === currentSession()?.email).length;
      historyMeta.textContent = count ? `${count} reservation${count === 1 ? '' : 's'} with order details` : 'No activity yet';
    }

    const activity = document.querySelector('#customer-home section.section');
    if (activity) {
      activity.querySelector('.empty,.dynamic-stack')?.remove();
      const recent = [];
      s.reservations.slice(-1).forEach(r => recent.push({ title: `Reservation ${r.id}`, meta: `${formatDate(r.date)} · ${r.status}` }));
      s.orders.slice(-1).forEach(o => recent.push({ title: `Order ${o.id}`, meta: `${money(o.total)} · ${o.status}` }));
      const d = document.createElement('div');
      d.className = recent.length ? 'dynamic-stack' : 'empty';
      d.innerHTML = recent.length
        ? recent.map(r => `<div class="dynamic-row"><strong>${esc(r.title)}</strong><span class="meta">${esc(r.meta)}</span></div>`).join('')
        : 'No reservations or orders yet.';
      activity.appendChild(d);
    }
  }

  function renderAll() { updateCustomerTableUI(); updateReservationTableOptions(); renderMenuScreens(); renderCart(); renderReservationDetails(); renderReservationConfirmation(); renderCustomerReservations(); renderTableConnected(); renderOrderConfirmation(); renderOrders(); renderOrderTracking(); renderServiceRequestSent(); renderBill(); renderPayment(); renderPaymentSuccess(); renderStaff(); renderKitchen(); renderManager(); renderCustomerHistory(); const id = screenId(); if (/^item-\d+$/.test(id) || id === 'item-dynamic') renderItemPage(id); }
  function handleRoute() {
    if (!guardRoute()) return;
    renderAll();
    if (currentSession()?.role === 'staff' && screenId() === 'staff-reservations') {
      refreshStaffPendingWithNotice();
    }
    if (currentSession()?.role === 'customer' &&
      ['my-reservations', 'reservation-confirmation', 'customer-home'].includes(screenId())) {
      refreshReservationsWithNotice();
    }
  }
  async function boot() {
    loadState(); initLogin(); initReservation(); initTables(); initCart(); initServiceRequests(); initManagerForms();
    window.addEventListener('hashchange', handleRoute);
    try {
      const result = await apiRequest('/auth/me');
      const user = result.user || result.data?.user || result.data;
      if (user?.role) setSession({ id: user.id ?? user.user_id, email: user.email, role: user.role, name: user.name || user.full_name });
      else clearSession();
    } catch { clearSession(); }
    await syncMenuFromBackend();
    if (currentSession()?.role === 'customer') await refreshReservationsWithNotice();
    if (currentSession()?.role === 'staff') await refreshStaffPendingWithNotice();
    if (!currentSession()) location.hash = '#login';
    else if (!location.hash || location.hash === '#login') location.hash = roleHome(currentSession().role);
    handleRoute();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


// =========================================================
// EASY BACK NAVIGATION
// =========================================================
(function () {
  function fallbackScreenForRole() {
    const email =
      sessionStorage.getItem('yumioCurrentUser') ||
      localStorage.getItem('yumioCurrentUser') ||
      '';

    const normalized = String(email).toLowerCase();

    if (normalized === 'admin@yumio.test') return '#manager-dashboard';
    if (normalized === 'kitchen@yumio.test') return '#kitchen-dashboard';
    if (normalized === 'staff@yumio.test') return '#staff-dashboard';

    return '#customer-home';
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="go-back"]');
    if (!button) return;

    event.preventDefault();

    // Hash navigation creates browser-history entries, so normal back works
    // for the customer's/staff's actual route through the prototype.
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    // Safe fallback when a screen was opened directly.
    window.location.hash = fallbackScreenForRole();
  });
})();
