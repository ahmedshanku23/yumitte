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
          image: String(row.image_url || ''),
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
    'menu-breakfast', 'menu-lunch', 'menu-supper', 'menu-dinner', 'menu-drinks', 'menu-desserts', 'cart', 'orders', 'order-confirmation',
    'order-tracking', 'service-requests', 'service-request-sent', 'bill', 'payment', 'payment-success', 'profile',
    'customer-history', 'my-reservations', 'item-dynamic', ...Array.from({ length: 19 }, (_, i) => `item-${i + 1}`)
  ]);
  let toastTimer = null;

  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const money = value => { const n = Number(value || 0); return `MVR ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
  const screenId = () => (location.hash || '#login').slice(1);
  const categoryHash = c => ({ Breakfast: '#menu-breakfast', Lunch: '#menu-lunch', Supper: '#menu-supper', Dinner: '#menu-dinner', Drinks: '#menu-drinks', Desserts: '#menu-desserts' }[c] || '#menu-breakfast');
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
        if (user.role === 'staff') { await refreshStaffPendingWithNotice(); await syncStaffTables().catch(err => showToast(`Staff tables: ${err.message}`)); }
        if (user.role === 'kitchen') await syncKitchenFromBackend();
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
    createdAt: row.created_at || null,
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
    // Reconcile cached orders against the server's authoritative reservation status.
    // The cancellation endpoint atomically cancels any associated pre-orders.
    const cancelledIds = new Set(s.reservations.filter(r => r.status === 'Cancelled').map(r => r.id));
    for (const order of s.orders) {
      if (order.fromBackend && cancelledIds.has(String(order.reservationId))) {
        order.status = 'Cancelled';
        order.paid = false;
      }
    }
    const selectedOrder = s.orders.find(o => o.id === s.selectedOrderId);
    if (selectedOrder && selectedOrder.status === 'Cancelled') s.selectedOrderId = null;
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

    const tables = loadState().tables; // Show every table, regardless of guest count.
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
      const selected = state.tables.find(t => t.id === tableId);
      if (!selected) {
        updateReservationTableOptions();
        return showToast('That table is no longer available for the selected time. Please choose another table.');
      }

      if (guests > selected.capacity) {
        showToast(`Table ${selected.id} has ${selected.capacity} seats for ${guests} guests. Staff may need to arrange extra seating.`);
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
      (r?.status === 'Confirmed' ? `<button class="btn btn-primary dynamic-btn" data-customer-checkin="${esc(r.id)}">Check In</button><button class="btn btn-secondary dynamic-btn" data-select-preorder="${esc(r.id)}">Pre-Order Food</button>` : '');
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
      finalBill = null;
      finalBillReservationId = null;
      location.hash = '#payment';
      try { await refreshFinalBill(); } catch (error) { showToast(`Final bill unavailable: ${error.message}`); }
    } catch (err) { showToast(err.message); }
  }

  function renderCustomerReservations() {
    const s = loadState(), target = document.getElementById('my-reservations-list');
    if (!target) return;

    const draft = reservationDraft();
    const reservations = newestFirst(s.reservations
      .filter(x => x.customerEmail === currentSession()?.email));

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

        if (['Pending', 'Confirmed'].includes(r.status)) {
          actions += `<button class="btn btn-secondary dynamic-btn" data-reservation-action="cancel" data-id="${esc(r.id)}">Cancel Reservation</button>`;
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

        if (action === 'cancel') {
          (async () => {
            try {
              const q = await apiRequest(`/reservations/${encodeURIComponent(id)}/cancellation-quote`);
              const message = `Cancel reservation #${id}?\nCancellation fee: MVR ${q.cancellation_fee}\nDemo refund: MVR ${q.refund_amount}\nOutstanding cancellation fee: MVR ${q.fee_outstanding}\nNo real payment will be processed.`;
              if (!window.confirm(message)) return;
              const result = await apiRequest(`/reservations/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', body: JSON.stringify({ confirm: true }) });
              await syncCustomerReservations();
              showToast(result.message || 'Reservation cancelled.');
            } catch (err) { showToast(`Cancellation failed: ${err.message}`); }
          })();
          return;
        }
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

    const cats = MENU_SCREENS;
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

  const MENU_SCREENS = { 'menu-breakfast': 'Breakfast', 'menu-lunch': 'Lunch', 'menu-supper': 'Supper', 'menu-dinner': 'Dinner', 'menu-drinks': 'Drinks', 'menu-desserts': 'Desserts' };
  let menuSchedule = [];
  let menuClockTimer = null;
  const maleMinutes = () => { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Maldives', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); return Number(parts.find(x => x.type === 'hour').value) * 60 + Number(parts.find(x => x.type === 'minute').value); };
  const timeMinutes = v => { if (v == null) return null; const m = /^(\d{1,2}):(\d{2})/.exec(String(v)); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  function categoryAllowed(category, minutes = maleMinutes()) {
    const schedule = menuSchedule.find(row => row.category === category);
    if (!schedule) return false;
    if (!schedule.is_active) return false;
    if (schedule.is_all_day) return true;
    const begin = timeMinutes(schedule.start_time), stop = timeMinutes(schedule.end_time);
    if (begin === null || stop === null) return false;
    return begin < stop ? minutes >= begin && minutes < stop : minutes >= begin || minutes < stop;
  }
  function selectedMenuMinutes() {
    const preId = sessionStorage.getItem('yumioPreorderReservationSelectionV1');
    const state = loadState();
    const r = state.reservations.find(x => x.id === preId && x.status === 'Confirmed');
    return r ? timeMinutes(r.time) : maleMinutes();
  }
  function prepareMenuSections() {
    // Repurpose existing menu screens without changing their existing CSS or role guards.
    const mapping = { 'menu-startar': 'menu-lunch', 'menu-main-course': 'menu-supper', 'menu-desserts': 'menu-dinner' };
    const originalDessert = document.getElementById('menu-desserts');
    const cloneSource = originalDessert?.cloneNode(true);
    for (const [oldId, newId] of Object.entries(mapping)) { const node = document.getElementById(oldId); if (node) node.id = newId; }
    const parent = document.getElementById('menu-dinner')?.parentElement;
    if (parent && cloneSource) for (const [id, cat] of [['menu-drinks', 'Drinks'], ['menu-desserts', 'Desserts']]) { const clone = cloneSource.cloneNode(true); clone.id = id; clone.setAttribute('aria-label', cat + ' Menu · Yumio'); parent.appendChild(clone); }
    document.querySelectorAll('a[href]').forEach(a => { const old = a.getAttribute('href'); if (mapping[old?.slice(1)]) a.setAttribute('href', '#' + mapping[old.slice(1)]); });
    // All menu tabs are regenerated on each screen for consistent six-category navigation.
    Object.entries(MENU_SCREENS).forEach(([id, cat]) => {
      const sec = document.getElementById(id); if (!sec) return;
      sec.setAttribute('aria-label', cat + ' Menu · Yumio');
      const greeting = sec.querySelector('.app-header .greeting'); if (greeting) greeting.textContent = cat;
      const row = sec.querySelector('.menu-row'); if (row) row.innerHTML = Object.entries(MENU_SCREENS).map(([target, label]) => `<a class="menu-chip" href="#${target}">${label}</a>`).join('');
    });
  }
  async function syncMenuSchedule() {
    try { const data = await apiRequest('/menu/schedules'); if (!Array.isArray(data.data)) throw Error('Invalid menu schedules'); menuSchedule = data.data; }
    catch (err) { menuSchedule = []; console.error('Menu schedule unavailable', err); showToast('Menu availability cannot be verified.'); }
  }
  function adjustCartItem(id, delta) {
    const s = loadState(), item = s.menu.find(x => x.id === id);
    if (!item || !item.available || !categoryAllowed(item.category, selectedMenuMinutes())) return showToast('This dish is not currently available.');
    const cart = loadCart(); let entry = cart.find(x => x.id === id && !x.notes);
    if (!entry && delta > 0) { entry = { id, name: item.name, price: item.price, quantity: 0, notes: '' }; cart.push(entry); }
    if (!entry) return;
    entry.quantity = Math.max(0, Math.min(50, entry.quantity + delta));
    if (entry.quantity === 0) cart.splice(cart.indexOf(entry), 1);
    saveCart(cart); renderMenuScreens(); renderCart(); updateCartSummary(); renderFloatingCart();
    const quantity = cart.filter(x => x.id === id).reduce((sum, x) => sum + Number(x.quantity || 0), 0);
    const cartTotal = cart.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.quantity || 0), 0);
    cartAnnouncement(`${item.name}, ${quantity} portions. Cart subtotal ${money(cartTotal)}.`);
    showToast(delta > 0 ? `${item.name} added to cart.` : 'Cart quantity updated.');
  }
  function renderMenuScreens() {
    const s = loadState(), minutes = selectedMenuMinutes();
    Object.entries(MENU_SCREENS).forEach(([screen, category]) => {
      const sec = document.getElementById(screen), grid = sec?.querySelector('.food-grid'); if (!grid) return;
      const allowed = categoryAllowed(category, minutes);
      sec.querySelectorAll('.menu-chip').forEach(chip => { const target = chip.getAttribute('href')?.slice(1); chip.classList.toggle('active', target === screen); const c = MENU_SCREENS[target]; chip.classList.toggle('menu-unavailable', !!c && !categoryAllowed(c, minutes)); });
      const items = s.menu.filter(x => x.category === category && x.available);
      if (!allowed) { grid.innerHTML = '<div class="empty">This menu is not available for the selected serving time. Choose the current meal, Drinks or Desserts.</div>'; return; }
      grid.innerHTML = items.length ? items.map(item => {
        const amount = loadCart().filter(c => c.id === item.id).reduce((n, c) => n + c.quantity, 0);
        const image = item.image && item.image.startsWith('/images/menu/') ? item.image : '';
        return `<article class="food" data-item-id="${esc(item.id)}"><button type="button" class="food-image-button" data-open-food="${esc(item.id)}" aria-label="View description of ${esc(item.name)}">${image ? `<img src="${esc(image)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none'">` : '<span>Image unavailable</span>'}</button><div class="food-body"><div class="food-title">${esc(item.name)}</div><div class="food-bottom"><span class="price">${money(item.price)}</span><div class="food-quantity"><button type="button" data-menu-minus="${esc(item.id)}" ${amount ? '' : 'disabled'} aria-label="Remove one ${esc(item.name)}">−</button><strong>${amount}</strong><button type="button" data-menu-plus="${esc(item.id)}" aria-label="Add one ${esc(item.name)}">+</button></div></div></div></article>`;
      }).join('') : '<div class="empty">No food items available in this category.</div>';
      const search = sec.querySelector('input'); if (search) { const q = search.value.trim().toLowerCase(); grid.querySelectorAll('article.food').forEach(c => c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none'); if (!search.dataset.bound) { search.dataset.bound = '1'; search.addEventListener('input', () => { const v = search.value.trim().toLowerCase(); grid.querySelectorAll('article.food').forEach(c => c.style.display = c.textContent.toLowerCase().includes(v) ? '' : 'none'); }); } }
    });
    updateCartSummary();
  }
  function renderItemPage(id) {
    const s = loadState(), itemId = id === 'item-dynamic' ? s.selectedMenuItemId : id, item = s.menu.find(x => x.id === itemId), sec = document.getElementById(id); if (!item || !sec) return;
    const card = sec.querySelector('section.card');
    const put = (selector, value) => { const el = sec.querySelector(selector); if (el) el.textContent = value; };
    put('.app-header .greeting', item.category); put('.app-header h1', item.name); put('.item-art', '');
    const art = sec.querySelector('.item-art'); if (art && item.image?.startsWith('/images/menu/')) art.innerHTML = `<img src="${esc(item.image)}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:18px">`;
    if (card) { const eyebrow = card.querySelector('.eyebrow'), title = card.querySelector('h1'), price = card.querySelector('h3'), description = card.querySelector('p'), qty = card.querySelector('select'), notes = card.querySelector('textarea'), actions = card.querySelector('.actions'); if (eyebrow) eyebrow.textContent = item.category; if (title) title.textContent = item.name; if (price) price.textContent = money(item.price); if (description) description.textContent = item.description; if (qty) qty.value = '1'; if (notes) notes.value = ''; if (actions) actions.innerHTML = `<a class="btn btn-primary btn-block" href="#cart" data-action="add-to-cart" data-id="${esc(item.id)}">Add to Cart</a><a class="btn btn-secondary btn-block" href="${categoryHash(item.category)}">Back to Menu</a>`; }
  }
  document.addEventListener('click', event => {
    const add = event.target.closest('[data-menu-plus]'), minus = event.target.closest('[data-menu-minus]'), open = event.target.closest('[data-open-food]');
    if (add) { event.preventDefault(); adjustCartItem(add.dataset.menuPlus, 1); return; }
    if (minus) { event.preventDefault(); adjustCartItem(minus.dataset.menuMinus, -1); return; }
    if (open) { event.preventDefault(); const st = loadState(); st.selectedMenuItemId = open.dataset.openFood; saveState(st); location.hash = '#item-dynamic'; renderItemPage('item-dynamic'); }
  });
  function initCart() {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-action="add-to-cart"]'); if (add) { e.preventDefault(); const s = loadState(), item = s.menu.find(x => x.id === add.dataset.id), sec = add.closest('.prototype-screen'), qty = Number(sec?.querySelector('select')?.value || 1), notes = sec?.querySelector('textarea')?.value.trim() || ''; if (!item || item.price == null || !item.available || !categoryAllowed(item.category, selectedMenuMinutes())) return showToast('This item is not available at this serving time.'); const cart = loadCart(), existing = cart.find(x => x.id === item.id && x.notes === notes); if (existing) existing.quantity += qty; else cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty, notes }); saveCart(cart); renderCart(); renderMenuScreens(); updateCartSummary(); renderFloatingCart(); showToast(`${item.name} added to cart.`); location.hash = '#cart'; return; }
      const c = e.target.closest('[data-cart-action]'); if (c) { const cart = loadCart(), i = Number(c.dataset.index); if (!cart[i]) return; if (c.dataset.cartAction === 'plus') cart[i].quantity++; if (c.dataset.cartAction === 'minus') cart[i].quantity = Math.max(1, cart[i].quantity - 1); if (c.dataset.cartAction === 'remove') cart.splice(i, 1); saveCart(cart); renderCart(); renderMenuScreens(); updateCartSummary(); renderFloatingCart(); return; }
      if (e.target.closest('[data-action="place-order"]')) { e.preventDefault(); placeOrder(); }
      if (e.target.closest('[data-action="place-preorder"]')) { e.preventDefault(); placePreorder(); }
    });
  }
  function updateCartSummary() { const cart = loadCart(), count = cart.reduce((a, x) => a + Number(x.quantity || 0), 0), total = cart.reduce((a, x) => a + Number(x.price || 0) * Number(x.quantity || 0), 0); Object.keys(MENU_SCREENS).forEach(id => { const l = document.getElementById(id)?.querySelector('a[href="#cart"].btn-primary'); if (l) l.textContent = `View Cart · ${count} item${count === 1 ? '' : 's'} · ${money(total)}`; }); }
  // Only show the checkout action permitted by the customer's reservation state.
  function activeCheckoutMode() {
    const customer = currentSession();
    if (!customer || customer.role !== 'customer') return null;
    const reservations = loadState().reservations.filter(r => r.customerEmail === customer.email);
    // Checked-in dining takes priority over any other pending/confirmed bookings.
    if (reservations.some(r => r.status === 'Checked In')) return 'regular';
    if (reservations.some(r => r.status === 'Confirmed')) return 'preorder';
    return null;
  }

  function renderCart() {
    const cart = loadCart(), card = document.querySelector('#cart section.card');
    if (!card) return;
    const total = cart.reduce((a, x) => a + x.price * x.quantity, 0);
    const browse = '<a class="btn btn-secondary" href="#menu-breakfast">Continue Ordering</a>';
    if (!cart.length) {
      card.innerHTML = '<div class="empty">Your cart is empty.</div><div class="total-row grand"><span>Total</span><span>MVR 0</span></div><div class="actions">' + browse + '</div>';
      return;
    }
    const rows = cart.map((x, i) => `<div class="cart-item"><div><strong>${esc(x.name)}</strong><div class="meta">${money(x.price)} each${x.notes ? ` · ${esc(x.notes)}` : ''}</div></div><div class="cart-controls"><button class="btn btn-secondary dynamic-btn" data-cart-action="minus" data-index="${i}">−</button><strong>${x.quantity}</strong><button class="btn btn-secondary dynamic-btn" data-cart-action="plus" data-index="${i}">+</button><button class="btn btn-secondary dynamic-btn" data-cart-action="remove" data-index="${i}">Remove</button></div></div>`).join('');
    const mode = activeCheckoutMode();
    const checkout = mode === 'regular'
      ? '<button class="btn btn-dark dynamic-btn" data-action="place-order">Place Order</button>'
      : mode === 'preorder'
        ? '<button class="btn btn-primary dynamic-btn" data-action="place-preorder">Pre-Order (40% Deposit)</button>'
        : '<p class="muted">You need a confirmed reservation to pre-order or a checked-in reservation to place an order.</p><a class="btn btn-secondary" href="#my-reservations">View Reservations</a>';
    card.innerHTML = `<div class="dynamic-stack">${rows}</div><div class="total-row grand"><span>Total</span><span>${money(total)}</span></div><div class="actions">${browse}${checkout}</div>`;
  }

  let cartOpener = null;
  const cartFocusSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function cartAnnouncement(message) {
    const region = document.getElementById('yumio-cart-announcement');
    if (region) region.textContent = message;
  }
  // Floating cart: uses the same localStorage cart as the existing checkout.
  function initFloatingCart() {
    const container = document.createElement('div');
    container.id = 'yumio-cart-overlay';
    container.innerHTML = `<button type="button" id="yumio-cart-float" aria-label="Open your cart" aria-expanded="false"></button>
      <div id="yumio-cart-backdrop" hidden></div>
      <aside id="yumio-cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" aria-hidden="true" tabindex="-1">
        <header class="yumio-drawer-head"><h2>Your Cart</h2><button type="button" id="yumio-cart-close" aria-label="Close cart">×</button></header>
        <div id="yumio-cart-drawer-items"></div><footer id="yumio-cart-drawer-footer"></footer>
        <div id="yumio-cart-announcement" class="yumio-visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
      </aside>`;
    document.body.appendChild(container);
    container.querySelector('#yumio-cart-float').addEventListener('click', () => toggleFloatingCart(true));
    container.querySelector('#yumio-cart-close').addEventListener('click', () => toggleFloatingCart(false));
    container.querySelector('#yumio-cart-backdrop').addEventListener('click', () => toggleFloatingCart(false));
    container.addEventListener('click', event => {
      const control = event.target.closest('[data-drawer-action]');
      if (!control) return;
      const cart = loadCart(), index = Number(control.dataset.index);
      if (!Number.isSafeInteger(index) || !cart[index]) return;
      if (control.dataset.drawerAction === 'plus') cart[index].quantity = Math.min(50, cart[index].quantity + 1);
      if (control.dataset.drawerAction === 'minus') cart[index].quantity -= 1;
      if (control.dataset.drawerAction === 'remove') cart[index].quantity = 0;
      saveCart(cart.filter(row => row.quantity > 0));
      renderMenuScreens(); renderCart(); updateCartSummary(); renderFloatingCart();
      const updated = loadCart();
      const portions = updated.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
      cartAnnouncement(`Cart updated. ${portions} portions. Subtotal ${money(updated.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0))}.`);
      // Rendering replaces buttons. Put focus on the same quantity action, or the close button if removed.
      const next = container.querySelector(`[data-drawer-action="${control.dataset.drawerAction}"][data-index="${index}"]`);
      (next && !next.disabled ? next : container.querySelector('#yumio-cart-close'))?.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', event => {
      const overlay = document.getElementById('yumio-cart-overlay');
      if (!overlay?.classList.contains('yumio-cart-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); toggleFloatingCart(false); return; }
      if (event.key !== 'Tab') return;
      const dialog = overlay.querySelector('#yumio-cart-drawer');
      const controls = [...dialog.querySelectorAll(cartFocusSelector)].filter(el => el.getClientRects().length);
      if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
      else if (!dialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    });
    window.addEventListener('hashchange', () => toggleFloatingCart(false));
    renderFloatingCart();
  }
  function toggleFloatingCart(show) {
    const overlay = document.getElementById('yumio-cart-overlay'); if (!overlay) return;
    const drawer = overlay.querySelector('#yumio-cart-drawer');
    const open = !!show && currentSession()?.role === 'customer';
    const wasOpen = overlay.classList.contains('yumio-cart-open');
    if (open && !wasOpen) cartOpener = document.activeElement;
    overlay.classList.toggle('yumio-cart-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    overlay.querySelector('#yumio-cart-float').setAttribute('aria-expanded', String(open));
    overlay.querySelector('#yumio-cart-backdrop').hidden = !open;
    document.body.classList.toggle('yumio-cart-no-scroll', open);
    if (open) { renderFloatingCart(); overlay.querySelector('#yumio-cart-close')?.focus({ preventScroll: true }); }
    else if (wasOpen) {
      const target = cartOpener?.isConnected && !cartOpener.hidden ? cartOpener : overlay.querySelector('#yumio-cart-float');
      target?.focus({ preventScroll: true });
      cartOpener = null;
    }
  }
  function renderFloatingCart() {
    const overlay = document.getElementById('yumio-cart-overlay'); if (!overlay) return;
    const show = currentSession()?.role === 'customer' && (screenId().startsWith('menu-') || screenId() === 'cart' || screenId() === 'item-dynamic' || /^item-\d+$/.test(screenId()));
    overlay.querySelector('#yumio-cart-float').hidden = !show;
    if (!show && overlay.classList.contains('yumio-cart-open')) toggleFloatingCart(false);
    const cart = loadCart();
    const count = cart.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const total = cart.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0);
    overlay.querySelector('#yumio-cart-float').textContent = `🛒 View Cart · ${count} · ${money(total)}`;
    overlay.querySelector('#yumio-cart-drawer-items').innerHTML = cart.length
      ? cart.map((row, i) => `<section class="yumio-drawer-item"><div class="yumio-drawer-item-title"><strong>${esc(row.name)}</strong><span>${esc(money(Number(row.price) * Number(row.quantity)))}</span></div><div class="meta">${esc(money(row.price))} each${row.notes ? ' · ' + esc(row.notes) : ''}</div><div class="yumio-drawer-quantity"><button type="button" data-drawer-action="minus" data-index="${i}" aria-label="Remove one ${esc(row.name)}">−</button><strong>${Number(row.quantity)}</strong><button type="button" data-drawer-action="plus" data-index="${i}" ${row.quantity >= 50 ? 'disabled' : ''} aria-label="Add one ${esc(row.name)}">+</button><button type="button" class="yumio-remove-item" data-drawer-action="remove" data-index="${i}">Remove</button></div></section>`).join('')
      : '<div class="empty">Your cart is empty.</div>';
    overlay.querySelector('#yumio-cart-drawer-footer').innerHTML = `<div class="yumio-cart-subtotal"><strong>Subtotal</strong><strong>${esc(money(total))}</strong></div><a href="#cart" class="btn btn-dark btn-block" id="yumio-cart-to-checkout">Proceed to Checkout</a><button type="button" class="btn btn-secondary btn-block" id="yumio-cart-continue">Continue Browsing</button>`;
    overlay.querySelector('#yumio-cart-continue').onclick = () => toggleFloatingCart(false);
    overlay.querySelector('#yumio-cart-to-checkout').onclick = () => toggleFloatingCart(false);
  }
  // Step 15.4a — regular orders are saved by the backend after check-in.
  // Pre-orders will be wired separately to the deposit confirmation screen.
  let orderSubmissionInProgress = false;
  async function placeOrder() {
    if (orderSubmissionInProgress) return;
    const cart = loadCart();
    if (!cart.length) return showToast('Your cart is empty.');
    if (currentSession()?.role !== 'customer') return showToast('Please sign in as a customer.');

    const state = loadState();
    const reservation = [...state.reservations].reverse().find(r =>
      r.customerEmail === currentSession()?.email && r.status === 'Checked In'
    );
    if (!reservation) {
      showToast('Check in to a confirmed reservation before placing a regular order.');
      location.hash = '#my-reservations';
      return;
    }

    const items = cart.map(row => ({
      item_id: Number(String(row.id).replace(/^item-/, '')),
      quantity: Number(row.quantity)
    }));
    if (items.some(row => !Number.isSafeInteger(row.item_id) || row.item_id <= 0 ||
      !Number.isSafeInteger(row.quantity) || row.quantity <= 0 || row.quantity > 50)) {
      return showToast('Invalid cart item or quantity.');
    }
    // Keep the same key for a retried request with the same cart/reservation.
    const signature = JSON.stringify({ reservation_id: Number(reservation.id), items });
    const storageKey = 'yumioPendingRegularOrderV1';
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { pending = null; }
    if (!pending || pending.signature !== signature) {
      pending = { signature, key: crypto.randomUUID() };
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
    }
    orderSubmissionInProgress = true;
    const button = document.querySelector('#cart [data-action="place-order"]');
    if (button) button.disabled = true;
    try {
      const result = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: Number(reservation.id),
          order_type: 'regular',
          items,
          idempotency_key: pending.key
        })
      });
      const row = result.order || result;
      const orderId = Number(row.order_id);
      if (!Number.isSafeInteger(orderId) || orderId < 1) {
        throw new Error('Backend did not return an order ID');
      }
      const live = loadState();
      const id = String(orderId);
      const original = live.orders.find(o => o.id === id && o.fromBackend);
      if (!original) {
        live.orders.push({
          id, fromBackend: true,
          customerEmail: currentSession().email,
          customerName: currentSession().name || 'Customer',
          tableId: reservation.tableId,
          reservationId: reservation.id,
          items: structuredClone(cart),
          total: Number(row.total_amount ?? cart.reduce((sum, x) => sum + x.price * x.quantity, 0)),
          status: 'Received', paid: false, createdAt: nowLabel()
        });
      }
      live.selectedOrderId = id;
      saveState(live);
      saveCart([]);
      sessionStorage.removeItem(storageKey);
      renderAll();
      location.hash = '#order-confirmation';
      showToast('Regular order saved in MySQL.');
    } catch (err) {
      showToast(`Order not confirmed: ${err.message}. Retry using the same cart.`);
    } finally {
      orderSubmissionInProgress = false;
      if (button) button.disabled = false;
    }
  }
  // Choose the reservation explicitly, rather than silently using the newest.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-select-preorder]');
    if (!button) return;
    event.preventDefault();
    const reservationId = String(button.dataset.selectPreorder);
    const state = loadState();
    const eligible = state.reservations.find(r => r.id === reservationId &&
      r.customerEmail === currentSession()?.email && r.status === 'Confirmed');
    if (!eligible) return showToast('Only confirmed reservations can be pre-ordered.');
    // Pre-orders are displayed according to the reservation's serving time,
    // not the time at which the customer happens to be browsing.
    const reservationMinutes = timeMinutes(eligible.time);
    if (reservationMinutes === null) {
      showToast('The reservation time could not be read. Please refresh your reservations.');
      return;
    }
    const meal = ['Breakfast', 'Lunch', 'Supper', 'Dinner'].find(category =>
      categoryAllowed(category, reservationMinutes)
    );
    if (!meal) {
      showToast('No meal menu is scheduled at your reservation time.');
      return;
    }
    sessionStorage.setItem('yumioPreorderReservationSelectionV1', reservationId);
    const screen = Object.keys(MENU_SCREENS).find(key => MENU_SCREENS[key] === meal);
    renderMenuScreens();
    location.hash = `#${screen}`;
    showToast(`Pre-ordering ${meal} for Reservation ${reservationId} at ${displayTime24h(eligible.time)}.`);
  });
  // Step 15.4B: pre-order creation and demo deposit confirmation.
  // A pending checkout is retained within this browser tab for safe retries.
  const PREORDER_PENDING_KEY = 'yumioPendingPreorderV1';
  let preorderInProgress = false;
  function preorderDialog({ orderId, total, deposit, reservationId }) {
    document.getElementById('yumio-preorder-dialog')?.remove();
    const shade = document.createElement('div');
    shade.id = 'yumio-preorder-dialog';
    shade.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px';
    const card = document.createElement('section');
    card.className = 'card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', 'Confirm demonstration pre-order deposit');
    card.style.cssText = 'width:min(520px,100%);max-height:90vh;overflow:auto;background:#fffdf8;padding:25px';
    const totalMoney = money(total), depositMoney = money(deposit);
    card.innerHTML = `<h2>Confirm Pre-Order Deposit</h2><p class="muted">Reservation ${esc(reservationId)} · Order ${esc(orderId)}</p><div class="dynamic-stack"><div class="dynamic-row"><span>Food total</span><strong>${esc(totalMoney)}</strong></div><div class="dynamic-row"><span>40% deposit due</span><strong>${esc(depositMoney)}</strong></div><div class="dynamic-row"><span>Remaining after deposit</span><strong>${esc(money(Math.max(0, Number(total) - Number(deposit))))}</strong></div></div><p class="muted">Demo payment only: no money will be charged. The pre-order remains pending until you confirm.</p><div class="actions"><button type="button" class="btn btn-dark" data-demo-pay>Confirm Demo Payment</button><button type="button" class="btn btn-secondary" data-demo-close>Not Now</button></div><p data-pay-message role="status" class="muted"></p>`;
    shade.appendChild(card); document.body.appendChild(shade);
    card.querySelector('[data-demo-close]').addEventListener('click', () => shade.remove());
    card.querySelector('[data-demo-pay]').addEventListener('click', async () => {
      const button = card.querySelector('[data-demo-pay]'); button.disabled = true;
      card.querySelector('[data-pay-message]').textContent = 'Confirming demo payment...';
      try {
        const paid = await apiRequest(`/orders/${Number(orderId)}/confirm-deposit`, { method: 'PATCH' });
        if (paid.order_status !== 'preordered' && paid.already_confirmed !== true) throw new Error('Unexpected payment confirmation response');
        const state = loadState();
        const pending = JSON.parse(sessionStorage.getItem(PREORDER_PENDING_KEY) || 'null');
        const previous = state.orders.find(o => o.id === String(orderId) && o.fromBackend);
        if (!previous) state.orders.push({
          id: String(orderId), fromBackend: true, preorder: true,
          customerEmail: currentSession()?.email || '', customerName: currentSession()?.name || 'Customer',
          reservationId: String(reservationId), tableId: pending?.tableId || '',
          items: pending?.cart || [], total: Number(total), status: 'Preordered',
          paid: false, depositPaid: Number(deposit), createdAt: nowLabel()
        });
        state.selectedOrderId = String(orderId);
        saveState(state);
        // Avoid erasing an unrelated cart if the user changed it in another tab.
        if (pending && JSON.stringify(loadCart()) === JSON.stringify(pending.cart)) saveCart([]);
        sessionStorage.removeItem(PREORDER_PENDING_KEY);
        shade.remove(); renderAll(); location.hash = '#order-confirmation';
        showToast('40% demo deposit recorded. Pre-order scheduled for kitchen.');
      } catch (err) {
        card.querySelector('[data-pay-message]').textContent = `Could not confirm: ${err.message}. You can retry.`;
        button.disabled = false;
      }
    });
    card.querySelector('[data-demo-pay]').focus();
  }
  async function placePreorder() {
    if (preorderInProgress) return;
    const cart = loadCart();
    if (!cart.length) return showToast('Your cart is empty.');
    if (currentSession()?.role !== 'customer') return showToast('Please sign in as a customer.');
    const confirmed = loadState().reservations.filter(r =>
      r.customerEmail === currentSession()?.email && r.status === 'Confirmed');
    const preferredId = sessionStorage.getItem('yumioPreorderReservationSelectionV1');
    const reservation = confirmed.find(r => r.id === preferredId) ||
      (confirmed.length === 1 ? confirmed[0] : null);
    if (!reservation && confirmed.length > 1) {
      showToast('Choose a confirmed reservation from My Reservations before pre-ordering.');
      location.hash = '#my-reservations'; return;
    }
    if (!reservation) { showToast('You need a staff-confirmed reservation to pre-order before check-in.'); location.hash = '#my-reservations'; return; }
    const items = cart.map(row => ({ item_id: Number(String(row.id).replace(/^item-/, '')), quantity: Number(row.quantity) }));
    if (items.some(x => !Number.isSafeInteger(x.item_id) || x.item_id < 1 || !Number.isSafeInteger(x.quantity) || x.quantity < 1 || x.quantity > 50)) return showToast('Invalid cart item or quantity.');
    const signature = JSON.stringify({ reservation_id: Number(reservation.id), items });
    let pending; try { pending = JSON.parse(sessionStorage.getItem(PREORDER_PENDING_KEY) || 'null'); } catch { pending = null; }
    if (!pending || pending.signature !== signature) { pending = { signature, key: crypto.randomUUID(), cart: structuredClone(cart), tableId: reservation.tableId }; sessionStorage.setItem(PREORDER_PENDING_KEY, JSON.stringify(pending)); }
    preorderInProgress = true;
    const button = document.querySelector('#cart [data-action="place-preorder"]'); if (button) button.disabled = true;
    try {
      let result;
      if (pending.orderId) { result = { order_id: pending.orderId, total_amount: pending.total, deposit_due: pending.deposit }; }
      else {
        result = await apiRequest('/orders', { method: 'POST', body: JSON.stringify({ reservation_id: Number(reservation.id), order_type: 'preorder', items, idempotency_key: pending.key }) });
      }
      const row = result.order || result;
      const orderId = Number(row.order_id), total = Number(row.total_amount), deposit = Number(row.deposit_due);
      // A retry of the POST may return the existing order without payment totals.
      if (!Number.isSafeInteger(orderId) || orderId < 1) throw new Error('Backend did not return an order ID');
      if (!pending.orderId && (!Number.isFinite(total) || !Number.isFinite(deposit))) {
        // Derive the expected display from the server-authoritative menu synced into the cart.
        // Do not attempt to settle an unknown amount: ask to retry after resolving order details.
        throw new Error('Order was created but totals were not returned. Please contact support before retrying checkout.');
      }
      pending = { ...pending, orderId, total: pending.total ?? total, deposit: pending.deposit ?? deposit };
      sessionStorage.setItem(PREORDER_PENDING_KEY, JSON.stringify(pending));
      preorderDialog({ orderId, total: pending.total, deposit: pending.deposit, reservationId: reservation.id });
    } catch (err) { showToast(`Pre-order pending: ${err.message}`); }
    finally { preorderInProgress = false; if (button) button.disabled = false; }
  }
  function renderOrderConfirmation() { const s = loadState(), o = s.orders.find(x => x.id === s.selectedOrderId) || s.orders.at(-1), e = document.querySelector('#order-confirmation .empty'); if (e) e.innerHTML = o ? `<strong>${esc(o.id)} placed successfully.</strong><br>${o.reservationId ? `Reservation ${esc(o.reservationId)} · ` : ''}Table ${esc(o.tableId)} · ${money(o.total)}<br>Status: <strong>${esc(o.status)}</strong>${o.preorder ? '<br>40% demo deposit confirmed. Kitchen receives the order after check-in.' : ''}` : 'No order has been submitted yet.'; }
  function renderOrders() {
    const s = loadState(), target = document.querySelector('#orders section.section');
    if (!target) return;
    const activeOrders = newestFirst(s.orders.filter(o => o.customerEmail === currentSession()?.email && o.status !== 'Cancelled'));
    if (!activeOrders.length) {
      target.innerHTML = '<div class="empty">No active orders to track. Cancelled orders remain in Reservation & Order History.<div class="actions" style="justify-content:center"><a class="btn btn-primary" href="#customer-history">View History</a></div></div>';
      return;
    }
    target.innerHTML = `<div class="dynamic-stack">${activeOrders.map(o => `<div class="card"><div class="section-head"><div><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${o.reservationId ? `Reservation ${esc(o.reservationId)} · ` : ''}${o.items.reduce((a, x) => a + x.quantity, 0)} items · ${money(o.total)} · ${esc(o.createdAt)}</div></div><span class="status">${esc(o.status)}</span></div><div class="actions"><button class="btn btn-secondary dynamic-btn" data-action="track-order" data-id="${esc(o.id)}">Track Order</button></div></div>`).join('')}</div>`;
    target.querySelectorAll('[data-action="track-order"]').forEach(b => b.addEventListener('click', () => {
      const st = loadState(); st.selectedOrderId = b.dataset.id; saveState(st);
      renderOrderTracking(); location.hash = '#order-tracking';
    }));
  }
  function renderOrderTracking() {
    const s = loadState(), target = document.querySelector('#order-tracking section.section');
    if (!target) return;
    const activeOrders = newestFirst(s.orders.filter(o => o.customerEmail === currentSession()?.email && o.status !== 'Cancelled'));
    const selected = activeOrders.find(o => o.id === s.selectedOrderId);
    const o = selected || activeOrders[0];
    if (!o) {
      target.innerHTML = '<div class="empty">There is no active order to track. Cancelled pre-orders are recorded in your Reservation & Order History.</div>';
      return;
    }
    const steps = ['Received', 'Accepted', 'Preparing', 'Ready', 'Served'];
    const current = o.status === 'Preordered' || o.status === 'Pre-Ordered' ? -1 : steps.indexOf(o.status);
    target.innerHTML = `<div class="card"><div class="section-head"><div><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${money(o.total)}</div></div><span class="status">${esc(o.status)}</span></div><div class="dynamic-stack">${steps.map((step, i) => `<div class="dynamic-row"><span>${i <= current ? '●' : '○'} ${esc(step)}</span><span>${i === current ? 'Current' : i < current ? 'Done' : ''}</span></div>`).join('')}</div></div>`;
  }

  function initServiceRequests() { document.querySelectorAll('#service-requests .grid-2 a.card').forEach(card => card.addEventListener('click', e => { e.preventDefault(); const s = loadState(); if (!s.customerTableId) { showToast('Check in or connect to a table before sending a service request.'); location.hash = '#reserve'; return; } const activeTable = s.tables.find(t => t.id === s.customerTableId); if (!activeTable || activeTable.status !== 'Occupied') return showToast('This dining session is no longer active.'); const title = card.querySelector('h3')?.textContent.trim().replace(/^\S+\s*/, '') || 'Other'; s.serviceRequests.push({ id: nextId('REQ', s.serviceRequests), customerEmail: 'shanku@yumio.test', tableId: s.customerTableId, type: title, status: 'Pending', createdAt: nowLabel() }); saveState(s); renderAll(); location.hash = '#service-request-sent'; })); }
  function renderServiceRequestSent() { const s = loadState(), r = s.serviceRequests.at(-1), e = document.querySelector('#service-request-sent .empty'); if (e) e.innerHTML = r ? `<strong>${esc(r.type)} request sent.</strong><br>Table ${esc(r.tableId)} · Status: ${esc(r.status)}` : 'No service request has been sent yet.'; }

  // Step 15.6: use authoritative MySQL billing data for the selected dining session.
  const selectedDiningReservation = () => {
    const s = loadState();
    const mine = s.reservations.filter(r => r.customerEmail === currentSession()?.email);
    return mine.find(r => r.status === 'Dining Complete') || mine.find(r => r.status === 'Completed');
  };
  let finalBill = null;
  let finalBillReservationId = null;
  let finalPaymentReceipt = null;
  async function refreshFinalBill() {
    const r = selectedDiningReservation();
    if (!r) { finalBill = null; finalBillReservationId = null; renderBill(); renderPayment(); return; }
    const result = await apiRequest(`/payments/reservation/${encodeURIComponent(r.id)}/balance`);
    finalBill = result;
    finalBillReservationId = String(r.id);
    renderBill(); renderPayment();
  }
  function renderBill() {
    const card = document.querySelector('#bill section.card');
    if (!card) return;
    const r = selectedDiningReservation();
    if (!r || !finalBill || String(r.id) !== finalBillReservationId) {
      card.innerHTML = '<div class="empty">Your final bill will appear after you mark Dining Done.</div><div class="actions"><a class="btn btn-secondary" href="#my-reservations">My Reservations</a></div>';
      return;
    }
    card.innerHTML = `<div class="dynamic-stack"><div class="dynamic-row"><span>Reservation</span><strong>${esc(r.id)}</strong></div><div class="dynamic-row"><span>Food total</span><strong>${money(finalBill.total_amount)}</strong></div><div class="dynamic-row"><span>Already paid (including deposits)</span><strong>${money(finalBill.already_paid)}</strong></div></div><div class="total-row grand"><span>Remaining balance</span><span>${money(finalBill.final_balance)}</span></div><div class="actions"><a class="btn btn-secondary" href="#my-reservations">Reservations</a>${finalBill.payment_required ? '<a class="btn btn-dark" href="#payment">Pay Final Balance</a>' : '<span class="status">Paid in full — waiting for staff closure</span>'}</div>`;
  }
  function renderPayment() {
    const card = document.querySelector('#payment section.card');
    if (!card) return;
    const r = selectedDiningReservation();
    if (!r || !finalBill || String(r.id) !== finalBillReservationId) {
      card.innerHTML = '<div class="empty">No final bill available. Mark Dining Done after all food is served.</div><div class="actions"><a class="btn btn-secondary" href="#my-reservations">Reservations</a></div>';
      return;
    }
    card.innerHTML = `<div class="empty">Demo payment only. No money will be charged.</div><div class="dynamic-row"><span>Order total</span><strong>${money(finalBill.total_amount)}</strong></div><div class="dynamic-row"><span>Deposits and other payments</span><strong>${money(finalBill.already_paid)}</strong></div><div class="total-row grand"><span>Amount due</span><span>${money(finalBill.final_balance)}</span></div><div class="actions"><a class="btn btn-secondary" href="#bill">Back to Bill</a>${finalBill.payment_required ? '<button class="btn btn-dark dynamic-btn" data-action="pay-final-backend">Confirm Demo Payment</button>' : '<span class="status">Balance settled</span>'}</div>`;
    card.querySelector('[data-action="pay-final-backend"]')?.addEventListener('click', async e => {
      const button = e.currentTarget;
      button.disabled = true;
      try {
        const receipt = await apiRequest(`/payments/reservation/${encodeURIComponent(r.id)}/confirm-final`, { method: 'POST' });
        finalPaymentReceipt = receipt;
        await refreshFinalBill();
        location.hash = '#payment-success';
        renderPaymentSuccess();
      } catch (err) { showToast(`Final payment failed: ${err.message}`); button.disabled = false; }
    });
  }
  function renderPaymentSuccess() {
    const e = document.querySelector('#payment-success .empty');
    if (!e) return;
    e.innerHTML = finalPaymentReceipt?.success
      ? `<strong>Demo payment recorded.</strong><br>Reservation ${esc(finalPaymentReceipt.reservation_id)} · ${money(finalPaymentReceipt.amount_paid || '0.00')}<br>Balance: MVR 0.00<br>Service Staff can now close the table.`
      : 'No final payment has been completed in this session.';
  }
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
  function renderStaffDashboard() { const s = loadState(), sec = document.getElementById('staff-dashboard'); if (!sec) return; const m = sec.querySelectorAll('.metric'), vals = [staffPendingReservations.length, backendStaffTables.filter(x => x.status === 'occupied').length, s.serviceRequests.filter(x => x.status === 'Pending').length, backendStaffTables.filter(x => x.reservation_status === 'dining_done').length]; m.forEach((x, i) => { const b = x.querySelector('b'); if (b) b.textContent = vals[i] ?? 0; }); const blocks = sec.querySelectorAll('section.section'); if (blocks[0]) { const list = staffPendingReservations.slice(0, 4).map(r => ({ id: String(r.reservation_id), customerName: r.customer_name, date: localDateString(r.reservation_date), time: String(r.reservation_time).slice(0, 5), status: 'Pending' })); blocks[0].querySelector('.empty,.dynamic-stack')?.remove(); const d = document.createElement('div'); d.className = list.length ? 'dynamic-stack' : 'empty'; d.innerHTML = list.length ? list.map(x => `<div class="dynamic-row"><span><strong>${esc(x.id)}</strong><br><span class="meta">${esc(x.customerName)} · ${esc(formatDate(x.date))} ${esc(x.time)}</span></span><span class="status">${esc(x.status)}</span></div>`).join('') : 'No reservations.'; blocks[0].appendChild(d); } if (blocks[1]) { const list = s.serviceRequests.filter(x => x.status === 'Pending').slice(-4).reverse(); blocks[1].querySelector('.empty,.dynamic-stack')?.remove(); const d = document.createElement('div'); d.className = list.length ? 'dynamic-stack' : 'empty'; d.innerHTML = list.length ? list.map(x => `<div class="dynamic-row"><span><strong>${esc(x.type)}</strong><br><span class="meta">Table ${esc(x.tableId)} · ${esc(x.createdAt)}</span></span><span class="status">${esc(x.status)}</span></div>`).join('') : 'No service requests.'; blocks[1].appendChild(d); } }
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

  let backendStaffTables = [];
  let staffTablesLoaded = false;
  async function syncStaffTables() {
    if (currentSession()?.role !== 'staff') return;
    const result = await apiRequest('/staff/tables');
    if (!Array.isArray(result.data)) throw new Error('Unexpected staff table response');
    backendStaffTables = result.data;
    staffTablesLoaded = true;
    renderStaffTables();
    renderStaffDashboard();
  }
  async function releaseTableByStaff(reservationId) {
    if (releaseTableByStaff.busy) return;
    releaseTableByStaff.busy = true;
    try {
      await apiRequest(`/reservations/${encodeURIComponent(reservationId)}/close`, { method: 'PATCH' });
      showToast(`Reservation ${reservationId} completed. Table released.`);
      await syncStaffTables();
    } catch (err) { showToast(`Cannot close table: ${err.message}`); }
    finally { releaseTableByStaff.busy = false; }
  }
  function renderStaffTables() {
    const grid = document.querySelector('#staff-tables .table-grid');
    if (!grid) return;
    if (!staffTablesLoaded) { grid.innerHTML = '<div class="empty">Loading tables from MySQL…</div>'; return; }
    const tables = backendStaffTables.filter(t =>
      staffViewFilter === 'occupied' ? t.status === 'occupied'
        : staffViewFilter === 'bill' ? t.reservation_status === 'dining_done'
          : true
    );
    grid.innerHTML = tables.map(t => {
      const canClose = t.reservation_status === 'dining_done' && Number(t.remaining_balance) === 0;
      const reservationInfo = t.reservation_id ? `<div class="meta">Reservation ${esc(t.reservation_id)} · ${esc(t.reservation_status)}${t.reservation_status === 'dining_done' ? ` · Balance ${money(t.remaining_balance)}` : ''}</div>` : '';
      return `<div class="table-card"><strong>Table ${esc(String(t.table_number).padStart(2, '0'))}</strong><div class="status-line"><span class="status">${esc(t.status)}</span><span class="meta">${esc(t.capacity)} seats</span></div>${reservationInfo}<div class="actions"><button class="linkbtn dynamic-btn" data-show-code="${esc(t.table_number)}">View QR Code</button>${canClose ? `<button class="btn btn-primary dynamic-btn" data-close-reservation="${esc(t.reservation_id)}">Close Table / Make Available</button>` : t.reservation_status === 'dining_done' ? '<span class="meta">Payment required before closure</span>' : ''}</div></div>`;
    }).join('') || '<div class="empty">No tables match this filter.</div>';
    grid.querySelectorAll('[data-show-code]').forEach(b => b.addEventListener('click', () => showToast(`Table code: YUMIO-${String(b.dataset.showCode).padStart(2, '0')}`)));
    grid.querySelectorAll('[data-close-reservation]').forEach(b => b.addEventListener('click', () => releaseTableByStaff(b.dataset.closeReservation)));
  }
  function renderStaffRequests() { const s = loadState(), target = document.querySelector('#staff-requests section.section'); if (!target) return; const list = [...s.serviceRequests].filter(x => staffViewFilter !== 'pending' || x.status === 'Pending').reverse(); target.innerHTML = list.length ? `<div class="dynamic-stack">${list.map(x => `<div class="card"><div class="section-head"><div><strong>${esc(x.type)} · Table ${esc(x.tableId)}</strong><div class="meta">${esc(x.id)} · ${esc(x.createdAt)}</div></div><span class="status">${esc(x.status)}</span></div>${x.status === 'Pending' ? `<div class="actions"><button class="btn btn-dark dynamic-btn" data-complete-request="${esc(x.id)}">Mark Complete</button></div>` : ''}</div>`).join('')}</div>` : '<div class="empty">No service requests.</div>'; target.querySelectorAll('[data-complete-request]').forEach(b => b.addEventListener('click', () => { const st = loadState(), r = st.serviceRequests.find(x => x.id === b.dataset.completeRequest); if (r) r.status = 'Completed'; saveState(st); renderAll(); showToast('Service request completed.'); })); }

  const kitchenStatusName = status => ({
    preordered: 'Pre-Ordered', received: 'Received', accepted: 'Accepted',
    preparing: 'Preparing', ready: 'Ready', served: 'Served'
  })[status] || status;
  let kitchenRefreshing = false;
  async function syncKitchenFromBackend() {
    if (!['kitchen', 'admin'].includes(currentSession()?.role) || kitchenRefreshing) return;
    kitchenRefreshing = true;
    try {
      const [scheduled, active] = await Promise.all([
        apiRequest('/kitchen/scheduled'), apiRequest('/kitchen/active')
      ]);
      if (!Array.isArray(scheduled.data) || !Array.isArray(active.data))
        throw new Error('Unexpected Kitchen API response');
      const state = loadState();
      const previous = new Map(state.orders.filter(o => o.fromBackend).map(o => [String(o.id), o]));
      const rows = [...scheduled.data, ...active.data];
      const byId = new Map(rows.map(row => [String(row.order_id), row]));
      state.orders = state.orders.filter(o => !o.fromBackend || byId.has(String(o.id)));
      for (const [id, row] of byId) {
        const old = previous.get(id);
        const normalized = {
          ...(old || {}), id, fromBackend: true,
          reservationId: String(row.reservation_id),
          tableId: String(row.table_number).padStart(2, '0'),
          preorder: row.order_type === 'preorder',
          total: Number(row.total_amount),
          status: kitchenStatusName(row.status),
          items: old?.items || [],
          createdAt: old?.createdAt || String(row.created_at || ''),
          customerName: row.customer_name || old?.customerName || 'Customer'
        };
        const index = state.orders.findIndex(o => o.fromBackend && String(o.id) === id);
        if (index >= 0) state.orders[index] = normalized; else state.orders.push(normalized);
      }
      saveState(state);
      renderKitchen();
    } catch (err) { showToast(`Kitchen sync failed: ${err.message}`); }
    finally { kitchenRefreshing = false; }
  }
  async function advanceKitchenOrder(id, target) {
    const state = loadState(), order = state.orders.find(o => String(o.id) === String(id));
    if (!order) return showToast('Order not found. Refresh Kitchen.');
    const expected = { Received: 'accepted', Accepted: 'preparing', Preparing: 'ready', Ready: 'served' }[order.status];
    if (!expected || expected !== target.toLowerCase()) return showToast('Invalid Kitchen status transition.');
    if (order.fromBackend) {
      if (!['kitchen', 'admin'].includes(currentSession()?.role))
        return showToast('Only Kitchen Personnel or Admin can update food status.');
      try {
        await apiRequest(`/kitchen/orders/${encodeURIComponent(id)}/status`, {
          method: 'PATCH', body: JSON.stringify({ status: expected })
        });
        await syncKitchenFromBackend();
        showToast(`Order ${id} updated to ${target}.`);
      } catch (err) { showToast(`Kitchen update failed: ${err.message}`); }
    } else {
      order.status = target;
      saveState(state); renderAll(); showToast(`Demo order ${id} updated.`);
    }
  }
  function renderKitchen() { renderKitchenDashboard(); renderKitchenDetail(); }
  function renderKitchenDashboard() { const s = loadState(), board = document.querySelector('#kitchen-dashboard .kitchen-board'); if (!board) return; const cols = board.querySelectorAll('.kitchen-col'), groups = [s.orders.filter(o => o.status === 'Pre-Ordered'), s.orders.filter(o => ['Received', 'Accepted'].includes(o.status)), s.orders.filter(o => o.status === 'Preparing'), s.orders.filter(o => o.status === 'Ready')]; cols.forEach((col, i) => { const heading = col.querySelector('h2')?.outerHTML || ''; const list = groups[i]; col.innerHTML = heading + (list.length ? list.map(o => `<div class="kitchen-order"><strong>${esc(o.id)} · Table ${esc(o.tableId)}</strong><div class="meta">${o.items.reduce((a, x) => a + x.quantity, 0)} items · ${esc(o.status)}${o.status === 'Pre-Ordered' ? ' · Waiting for customer check-in' : ''}</div><div class="actions"><button class="btn btn-secondary dynamic-btn" data-kitchen-order="${esc(o.id)}">View Items</button>${({ Received: 'Accept', Accepted: 'Start Preparing', Preparing: 'Mark Ready', Ready: 'Mark Served' }[o.status]) ? `<button class="btn btn-dark dynamic-btn" data-kitchen-advance="${esc(o.id)}">${esc({ Received: 'Accept', Accepted: 'Start Preparing', Preparing: 'Mark Ready', Ready: 'Mark Served' }[o.status])}</button>` : ''}</div></div>`).join('') : `<div class="empty">${i === 0 ? 'No scheduled pre-orders.' : i === 1 ? 'No new orders.' : i === 2 ? 'No orders preparing.' : 'No orders ready.'}</div>`); }); board.querySelectorAll('[data-kitchen-order]').forEach(b => b.addEventListener('click', () => { const st = loadState(); st.selectedOrderId = b.dataset.kitchenOrder; saveState(st); renderKitchenDetail(); location.hash = '#kitchen-order-detail'; })); board.querySelectorAll('[data-kitchen-advance]').forEach(b => b.addEventListener('click', () => { const st = loadState(), o = st.orders.find(x => x.id === b.dataset.kitchenAdvance); const next = { Received: 'Accepted', Accepted: 'Preparing', Preparing: 'Ready', Ready: 'Served' }; if (!o || !next[o.status]) return; advanceKitchenOrder(o.id, next[o.status]); })); }
  function renderKitchenDetail() { const s = loadState(), target = document.querySelector('#kitchen-order-detail section.section'), o = s.orders.find(x => x.id === s.selectedOrderId); if (!target) return; if (!o) { target.innerHTML = '<div class="empty">No kitchen order is selected.</div>'; return; } const next = { Received: ['Accepted', 'Accept Order'], Accepted: ['Preparing', 'Start Preparing'], Preparing: ['Ready', 'Mark Ready'], Ready: ['Served', 'Mark Served'] }[o.status]; target.innerHTML = `<div class="section-head"><div><h2>${esc(o.id)} · Table ${esc(o.tableId)}</h2><div class="meta">${esc(o.createdAt)}</div></div><span class="status">${esc(o.status)}</span></div><div class="dynamic-stack">${o.items.map(x => `<div class="dynamic-row"><span><strong>${esc(x.quantity)} × ${esc(x.name)}</strong>${x.notes ? `<br><span class="meta">${esc(x.notes)}</span>` : ''}</span><span>${money(x.price * x.quantity)}</span></div>`).join('')}</div>${next ? `<div class="actions"><button class="btn btn-dark dynamic-btn" data-next-order-status="${esc(next[0])}">${esc(next[1])}</button></div>` : o.status === 'Served' ? '<div class="empty">This order has been served.</div>' : o.status === 'Pre-Ordered' ? '<div class="empty">This pre-order is scheduled. Preparation becomes available after customer check-in.</div>' : o.status === 'Cancelled' ? '<div class="empty">This order was cancelled.</div>' : `<div class="empty">Order status: ${esc(o.status)}.</div>`}`; target.querySelector('[data-next-order-status]')?.addEventListener('click', e => { const st = loadState(), live = st.orders.find(x => x.id === o.id); if (!live) return; advanceKitchenOrder(o.id, e.currentTarget.dataset.nextOrderStatus); }); }

  function initManagerForms() {
    document.getElementById('manager-add-menu-form')?.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('add-item-name')?.value.trim(), price = Number(document.getElementById('add-item-price')?.value), category = document.getElementById('add-item-category')?.value, icon = document.getElementById('add-item-icon')?.value.trim() || '🍽️', description = document.getElementById('add-item-description')?.value.trim() || ''; if (!name || !Number.isFinite(price) || price <= 0 || !category) return showToast('Enter a valid item name, price and category.'); const s = loadState(); s.menu.push({ id: `custom-${Date.now()}`, name, price, category, icon, description, available: true }); saveState(s); e.currentTarget.reset(); document.getElementById('add-item-icon').value = '🍽️'; renderAll(); showToast('Menu item added.'); location.hash = '#manager-menu'; });
    document.getElementById('manager-edit-menu-form')?.addEventListener('submit', e => { e.preventDefault(); const s = loadState(), item = s.menu.find(x => x.id === s.selectedMenuItemId); if (!item) return showToast('Choose a menu item to edit.'); const name = document.getElementById('edit-item-name')?.value.trim(), price = Number(document.getElementById('edit-item-price')?.value), category = document.getElementById('edit-item-category')?.value, icon = document.getElementById('edit-item-icon')?.value.trim() || '🍽️', description = document.getElementById('edit-item-description')?.value.trim() || ''; if (!name || !Number.isFinite(price) || price <= 0 || !category) return showToast('Enter a valid item name, price and category.'); Object.assign(item, { name, price, category, icon, description }); saveState(s); renderAll(); showToast('Menu item updated.'); location.hash = '#manager-menu'; });
  }
  function renderManager() { renderManagerDashboard(); renderManagerMenu(); renderManagerHistory(); renderManagerEditForm(); }
  function renderManagerDashboard() { const s = loadState(), sec = document.getElementById('manager-dashboard'); if (!sec) return; const m = sec.querySelectorAll('.metric'), vals = [s.reservations.length, s.orders.length, money(s.payments.reduce((a, x) => a + x.amount, 0)), 1]; m.forEach((x, i) => { const b = x.querySelector('b'); if (b) b.textContent = vals[i] ?? 0; }); const snap = sec.querySelector('section.section'), sm = snap?.querySelectorAll('.metric'); if (sm?.length >= 3) { const avail = s.tables.filter(x => x.status === 'Available').length, occ = s.tables.filter(x => x.status === 'Occupied').length, res = s.tables.filter(x => x.status === 'Reserved').length, active = s.orders.filter(x => x.status !== 'Served').length, req = s.serviceRequests.filter(x => x.status === 'Pending').length; let b = sm[0].querySelector('b'), small = sm[0].querySelector('small'); if (b) b.textContent = s.tables.length; if (small) small.textContent = `${avail} available · ${occ} occupied · ${res} reserved`; b = sm[1].querySelector('b'); small = sm[1].querySelector('small'); if (b) b.textContent = active; if (small) small.textContent = active ? 'Active kitchen orders' : 'No active orders'; b = sm[2].querySelector('b'); small = sm[2].querySelector('small'); if (b) b.textContent = req; if (small) small.textContent = req ? 'Pending requests' : 'No pending requests'; } }
  function renderManagerMenu() { const s = loadState(), grid = document.querySelector('#manager-menu .menu-admin-grid'); if (!grid) return; grid.innerHTML = s.menu.map(item => `<div class="menu-admin-card ${item.available ? '' : 'menu-item-hidden'}"><div class="menu-admin-icon">${esc(item.icon || '🍽️')}</div><div><div class="section-head"><div><strong>${esc(item.name)}</strong><div class="meta">${esc(item.category)} · ${item.price == null ? 'Price TBC' : money(item.price)}</div></div><span class="status">${item.available ? 'Available' : 'Hidden'}</span></div><p class="muted">${esc(item.description || '')}</p><div class="actions"><button class="btn btn-outline dynamic-btn" data-menu-action="edit" data-id="${esc(item.id)}">Edit</button><button class="btn btn-secondary dynamic-btn" data-menu-action="toggle" data-id="${esc(item.id)}">${item.available ? 'Hide' : 'Show'}</button><button class="btn btn-secondary dynamic-btn" data-menu-action="remove" data-id="${esc(item.id)}">Remove</button></div></div></div>`).join(''); grid.querySelectorAll('[data-menu-action]').forEach(b => b.addEventListener('click', () => { const st = loadState(), item = st.menu.find(x => x.id === b.dataset.id); if (!item) return; const a = b.dataset.menuAction; if (a === 'edit') { st.selectedMenuItemId = item.id; saveState(st); renderManagerEditForm(); location.hash = '#manager-menu-edit'; return; } if (a === 'toggle') item.available = !item.available; if (a === 'remove') st.menu = st.menu.filter(x => x.id !== item.id); saveState(st); renderAll(); showToast(a === 'remove' ? 'Menu item removed.' : `Menu item ${item.available ? 'shown' : 'hidden'}.`); })); }
  function renderManagerEditForm() { const s = loadState(), item = s.menu.find(x => x.id === s.selectedMenuItemId); if (!item) return; const map = { 'edit-item-name': item.name, 'edit-item-price': item.price ?? '', 'edit-item-category': item.category, 'edit-item-icon': item.icon || '🍽️', 'edit-item-description': item.description || '' }; Object.entries(map).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; }); }
  // Phase 6: History views are newest-first, regardless of API/array order.
  // Use the record's creation timestamp where available; fall back to numeric IDs.
  function historyIdNumber(value) {
    const match = String(value ?? '').match(/(\d+)$/);
    return match ? Number(match[1]) : -1;
  }
  function historyTime(value) {
    if (!value) return NaN;
    const text = String(value).trim();
    // SQL datetime strings (without timezone) are interpreted as Maldives time.
    const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text) ? text.replace(' ', 'T') + '+05:00' : text;
    const n = Date.parse(iso);
    return Number.isFinite(n) ? n : NaN;
  }
  function newestFirst(rows) {
    return [...rows].sort((a, b) => {
      const at = historyTime(a.createdAt ?? a.created_at ?? a.timestamp);
      const bt = historyTime(b.createdAt ?? b.created_at ?? b.timestamp);
      if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return bt - at;
      // IDs are comparable within a single record type. Mixed-type histories
      // primarily use timestamps and preserve source order when absent.
      const ai = historyIdNumber(a.id ?? a.sortId);
      const bi = historyIdNumber(b.id ?? b.sortId);
      if (a.kind === b.kind && ai !== bi) return bi - ai;
      return 0;
    });
  }
  function renderHistorySection(screen, heading, rows) { const sec = document.getElementById(screen), target = sec?.querySelector('section.section'); if (!target) return; const tabs = target.querySelector('.history-tabs')?.outerHTML || '', p = target.querySelector('p.meta')?.outerHTML || ''; target.innerHTML = `<h2>${esc(heading)}</h2>${p}${tabs}${rows.length ? `<div class="dynamic-stack" style="margin-top:18px">${newestFirst(rows).map(r => `<div class="card"><strong>${esc(r.title)}</strong><div class="meta">${esc(r.meta)}</div></div>`).join('')}</div>` : `<div class="empty" style="margin-top:18px">No ${esc(heading.toLowerCase())} history.</div>`}`; }
  function renderManagerHistory() { const s = loadState(); renderHistorySection('manager-history-orders', 'Orders', s.orders.map(o => ({ id: o.id, kind: "orders", createdAt: o.createdAt ?? o.created_at, title: `${o.id} · Table ${o.tableId}`, meta: `${o.status} · ${money(o.total)} · ${o.createdAt}` }))); renderHistorySection('manager-history-reservations', 'Reservations', s.reservations.map(r => ({ id: r.id, kind: "reservations", createdAt: r.createdAt ?? r.created_at, title: `${r.id} · ${r.customerName}`, meta: `${formatDate(r.date)} ${r.time} · ${r.guests} guests · ${r.status}${r.tableId ? ` · Table ${r.tableId}` : ''}` }))); renderHistorySection('manager-history-payments', 'Payments', s.payments.map(p => ({ id: p.id, kind: "payments", createdAt: p.createdAt ?? p.created_at, title: `${p.id} · ${money(p.amount)}`, meta: `${p.status} · ${p.method} · ${p.createdAt}` }))); renderHistorySection('manager-history-customers', 'Customers', [{ title: 'Shanku', meta: 'shanku@yumio.test · Customer' }]); renderHistorySection('manager-history-requests', 'Service Requests', s.serviceRequests.map(r => ({ id: r.id, kind: "serviceRequests", createdAt: r.createdAt ?? r.created_at, title: `${r.id} · ${r.type}`, meta: `Table ${r.tableId} · ${r.status} · ${r.createdAt}` }))); }

  function renderCustomerHistory() {
    const s = loadState(), sec = document.getElementById('customer-history');
    if (!sec) return;

    const target = document.getElementById('reservation-order-history-list');
    if (target) {
      const reservations = newestFirst(s.reservations
        .filter(r => r.customerEmail === currentSession()?.email));

      const walkInOrders = newestFirst(s.orders.filter(o => o.customerEmail === 'shanku@yumio.test' && !o.reservationId));

      let html = '<h2>Reservation & Order History</h2>';

      if (!reservations.length && !walkInOrders.length) {
        html += '<div class="empty">No reservation or order history yet.</div>';
      } else {
        html += '<div class="dynamic-stack">';

        reservations.forEach(r => {
          const orders = newestFirst(s.orders.filter(o => o.customerEmail === 'shanku@yumio.test' && o.reservationId === r.id));
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
      newestFirst(s.reservations).slice(0, 1).forEach(r => recent.push({ title: `Reservation ${r.id}`, meta: `${formatDate(r.date)} · ${r.status}` }));
      newestFirst(s.orders).slice(0, 1).forEach(o => recent.push({ title: `Order ${o.id}`, meta: `${money(o.total)} · ${o.status}` }));
      const d = document.createElement('div');
      d.className = recent.length ? 'dynamic-stack' : 'empty';
      d.innerHTML = recent.length
        ? recent.map(r => `<div class="dynamic-row"><strong>${esc(r.title)}</strong><span class="meta">${esc(r.meta)}</span></div>`).join('')
        : 'No reservations or orders yet.';
      activity.appendChild(d);
    }
  }

  // Read-only role-specific history views; all screens use the existing browser data.
  const historyFilters = Object.create(null);
  const histVal = v => String(v ?? '');
  const histText = v => esc(histVal(v));
  const historyRow = (title, detail, status, search, extra = '', source = {}) => ({ title, detail, status: histVal(status), search: histVal(search).toLowerCase(), extra, id: source.id, kind: source.kind, createdAt: source.createdAt });
  function linkedReservation(o, s) { return s.reservations.find(r => r.id === o.reservationId) || s.reservations.find(r => r.tableId === o.tableId && r.customerEmail === o.customerEmail) || null; }
  function historyData(screen, s) {
    if (screen === 'staff-history') {
      return [
        ...s.reservations.map(r => historyRow(`Reservation ${histText(r.id)}`, `${histText(r.customerName)} · ${histText(r.customerEmail)} · Table ${histText(r.tableId || 'TBD')} · ${histText(formatDate(r.date))} ${histText(r.time)} · ${histText(r.guests)} guests`, r.status, `${r.id} ${r.customerName} ${r.customerEmail} ${r.tableId} ${r.status}`, `<p class="meta">Check-in: ${histText(r.checkedInAt || 'Not recorded')} · Dining: ${histText(r.diningDoneAt || 'Not recorded')}</p>`, { id: r.id, kind: 'reservation', createdAt: r.createdAt })),
        ...s.serviceRequests.map(r => historyRow(`Service request ${histText(r.id)}`, `Table ${histText(r.tableId)} · ${histText(r.type)} · ${histText(r.createdAt)}`, r.status, `${r.id} ${r.tableId} ${r.type} ${r.status}`, '', { id: r.id, kind: 'request', createdAt: r.createdAt })),
        ...s.payments.map(p => historyRow(`Payment ${histText(p.id)}`, `${histText(money(p.amount))} · ${histText(p.method)} · ${histText(p.createdAt)} · Table ${histText(p.tableId || '—')}`, p.status, `${p.id} ${p.tableId} ${p.status} payment`, '', { id: p.id, kind: 'payment', createdAt: p.createdAt }))
      ];
    }
    if (screen === 'kitchen-history') {
      return s.orders.map(o => historyRow(`Order ${histText(o.id)} · Table ${histText(o.tableId)}`, `${histText(o.preorder ? 'Pre-order' : 'Regular order')} · ${histText(o.createdAt)} · ${histText(money(o.total))}`, o.status, `${o.id} ${o.tableId} ${o.customerName} ${o.status} ${o.items.map(x => x.name).join(' ')}`, `<div class="history-item-lines">${o.items.map(x => `<div>${histText(x.quantity)} × ${histText(x.name)} ${x.notes ? `<span class="meta">· ${histText(x.notes)}</span>` : ''}</div>`).join('')}</div><div class="meta">Reservation: ${histText(o.reservationId || 'Not linked')} · Check-in: ${histText(o.checkedInAt || 'Not recorded')}</div>`, { id: o.id, kind: 'order', createdAt: o.createdAt }));
    }
    return s.reservations.map(r => {
      const orders = newestFirst(s.orders.filter(o => o.reservationId === r.id));
      const payments = newestFirst(s.payments.filter(p => p.reservationId === r.id || orders.some(o => o.id === p.orderId) || (!p.reservationId && !p.orderId && p.customerEmail === r.customerEmail && (p.tableId === r.tableId || !p.tableId))));
      const requests = newestFirst(s.serviceRequests.filter(q => q.tableId === r.tableId && q.customerEmail === r.customerEmail));
      const billed = orders.reduce((a, o) => a + Number(o.total || 0), 0);
      const settled = orders.reduce((a, o) => a + Number(o.amountPaid || 0), 0);
      const outstanding = orders.reduce((a, o) => a + Math.max(0, Number(o.total || 0) - Number(o.amountPaid || 0)), 0);
      const allOrders = orders.length ? orders.map(o => `<div class="history-line"><strong>${histText(o.id)}</strong> · ${histText(o.preorder ? 'Pre-order' : 'After check-in')} · <span class="status">${histText(o.status)}</span> · ${histText(money(o.total))}<div class="meta">${o.items.map(x => `${histText(x.quantity)} × ${histText(x.name)}`).join(' · ')}</div></div>`).join('') : '<div class="meta">No orders under this reservation.</div>';
      const allPayments = payments.length ? payments.map(p => `<div class="history-line">${histText(p.id)} · ${histText(p.type || p.method)} · ${histText(money(p.amount))} · ${histText(p.status)}<div class="meta">${histText(p.createdAt)}</div></div>`).join('') : '<div class="meta">No payment records linked or attributable to this visit.</div>';
      const allRequests = requests.length ? requests.map(q => `<div class="history-line">${histText(q.id)} · ${histText(q.type)} · ${histText(q.status)}</div>`).join('') : '<div class="meta">No recorded service requests.</div>';
      return historyRow(`Reservation ${histText(r.id)} · ${histText(r.customerName)}`, `Table ${histText(r.tableId || 'TBD')} · ${histText(formatDate(r.date))} ${histText(r.time)} · ${histText(r.guests)} guests · ${histText(r.customerEmail)}`, r.status, `${r.id} ${r.customerName} ${r.customerEmail} ${r.tableId} ${r.status} ${orders.map(o => o.id).join(' ')}`, `<details class="visit-details"><summary>View complete visit and billing</summary><div class="history-detail-body"><div class="meta">Reservation: ${histText(r.id)} · Check-in: ${histText(r.checkedInAt || 'Not recorded')} · Dining complete: ${histText(r.diningDoneAt || 'Not recorded')}</div><h3>Orders (${orders.length})</h3>${allOrders}<h3>Financial summary</h3><div class="history-line">Total ordered: <strong>${histText(money(billed))}</strong> · Amount credited to orders: <strong>${histText(money(settled))}</strong> · Outstanding: <strong>${histText(money(outstanding))}</strong></div><h3>Payment records (${payments.length})</h3>${allPayments}<h3>Service requests (${requests.length})</h3>${allRequests}<p class="meta">Staff/kitchen action timestamps are displayed only where recorded. Earlier activity cannot be reconstructed retroactively.</p></div></details>`, { id: r.id, kind: 'reservation', createdAt: r.createdAt });
    });
  }
  function renderRoleHistory(screen) {
    const holder = document.querySelector(`[data-history-results="${screen}"]`), select = document.querySelector(`[data-history-filter="${screen}"]`);
    if (!holder || !select) return;
    const data = historyData(screen, loadState());
    const old = select.value;
    const statuses = [...new Set(data.map(r => r.status))].sort();
    select.innerHTML = '<option value="all">All statuses</option>' + statuses.map(s => `<option value="${histText(s)}">${histText(s)}</option>`).join('');
    select.value = statuses.includes(old) ? old : 'all';
    const q = histVal(document.querySelector(`[data-history-search="${screen}"]`)?.value).toLowerCase().trim();
    const results = data.filter(r => (select.value === 'all' || r.status === select.value) && (!q || r.search.includes(q)));
    holder.innerHTML = results.length ? `<div class="history-count">Showing ${results.length} of ${data.length} records</div><div class="dynamic-stack">${newestFirst(results).map(r => `<article class="card history-record"><div class="section-head"><div><strong>${r.title}</strong><div class="meta">${r.detail}</div></div><span class="status">${histText(r.status)}</span></div>${r.extra}</article>`).join('')}</div>` : '<div class="empty">No matching history records.</div>';
  }
  ['staff-history', 'kitchen-history', 'manager-visit-history'].forEach(screen => {
    document.querySelector(`[data-history-search="${screen}"]`)?.addEventListener('input', () => renderRoleHistory(screen));
    document.querySelector(`[data-history-filter="${screen}"]`)?.addEventListener('change', () => renderRoleHistory(screen));
  });

  function setupAccessibilityNavigation() {
    document.getElementById('yumio-skip-content')?.addEventListener('click', () => {
      const screen = document.getElementById(screenId());
      const main = screen?.querySelector('main');
      if (!main) return;
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: false });
    });
  }
  function renderAll() { updateCustomerTableUI(); updateReservationTableOptions(); renderMenuScreens(); renderCart(); renderFloatingCart(); renderReservationDetails(); renderReservationConfirmation(); renderCustomerReservations(); renderTableConnected(); renderOrderConfirmation(); renderOrders(); renderOrderTracking(); renderServiceRequestSent(); renderBill(); renderPayment(); renderPaymentSuccess(); renderStaff(); renderKitchen(); renderManager(); renderCustomerHistory(); renderRoleHistory('staff-history'); renderRoleHistory('kitchen-history'); renderRoleHistory('manager-visit-history'); const id = screenId(); if (/^item-\d+$/.test(id) || id === 'item-dynamic') renderItemPage(id); }
  function handleRoute() {
    if (!guardRoute()) return;
    renderAll();
    if (currentSession()?.role === 'kitchen' && screenId().startsWith('kitchen-')) syncKitchenFromBackend();
    if (currentSession()?.role === 'staff' && ['staff-dashboard', 'staff-tables'].includes(screenId())) syncStaffTables().catch(err => showToast(`Staff tables: ${err.message}`));
    if (currentSession()?.role === 'customer' && ['bill', 'payment'].includes(screenId())) refreshFinalBill().catch(err => showToast(`Billing: ${err.message}`));
    if (currentSession()?.role === 'staff' && screenId() === 'staff-reservations') {
      refreshStaffPendingWithNotice();
    }
    if (currentSession()?.role === 'customer' &&
      ['my-reservations', 'reservation-confirmation', 'customer-home'].includes(screenId())) {
      refreshReservationsWithNotice();
    }
  }
  async function boot() {
    loadState(); prepareMenuSections(); await syncMenuSchedule(); initLogin(); initReservation(); initTables(); initCart(); setupAccessibilityNavigation(); initFloatingCart(); initServiceRequests(); initManagerForms();
    menuClockTimer = setInterval(() => { if (currentSession()?.role === 'customer' && screenId().startsWith('menu-')) renderMenuScreens(); }, 30000);
    window.addEventListener('hashchange', handleRoute);
    try {
      const result = await apiRequest('/auth/me');
      const user = result.user || result.data?.user || result.data;
      if (user?.role) setSession({ id: user.id ?? user.user_id, email: user.email, role: user.role, name: user.name || user.full_name });
      else clearSession();
    } catch { clearSession(); }
    await syncMenuFromBackend();
    if (currentSession()?.role === 'customer') await refreshReservationsWithNotice();
    if (currentSession()?.role === 'staff') { await refreshStaffPendingWithNotice(); await syncStaffTables().catch(err => showToast(`Staff tables: ${err.message}`)); }
    if (currentSession()?.role === 'kitchen') await syncKitchenFromBackend();
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
