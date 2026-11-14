const userId  = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const storyId = new URLSearchParams(window.location.search).get('id');
if (!storyId) window.location.href = 'dashboard.html';

const MIN_LOCS = 10;
const MAX_LOCS = 15;
const MAX_DIST = 550; // metres between consecutive stops

let map, routeLine, tempMarker;
let selectedLatLng = null;
const markers = {};
let storyType = 'T2';

DB.ready.then(init);

function init() {
  const user  = DB.getUserById(userId);
  const story = DB.getStoryById(storyId);
  if (!story) { window.location.href = 'dashboard.html'; return; }

  storyType = story.type || 'T2';

  if (user) {
    document.getElementById('navName').textContent = user.name;
    if (user.avatar) document.getElementById('navAvatar').src = user.avatar;
  }
  document.getElementById('backLink').href = `workspace.html?id=${storyId}`;

  if (story.coverPhoto) showCoverPreview(story.coverPhoto);

  initMap(story);
  loadExistingLocations();
  initForm();
  initAddrSearch();
  initCoverSection(story);
}

// ── Map ────────────────────────────────────────────────────────────────────
function initMap(story) {
  map = L.map('map').setView([25.033, 121.565], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let lastClick = 0;
  map.on('click', async e => {
    const now = Date.now();
    if (now - lastClick < 900) return;
    lastClick = now;
    const { lat, lng } = e.latlng;
    setTempPin(lat, lng);
    document.getElementById('mapTip').style.opacity = '0';
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      document.getElementById('locAddress').value = data.display_name || '';
    } catch { /* ignore */ }
  });
}

function setTempPin(lat, lng) {
  selectedLatLng = { lat, lng };
  if (tempMarker) map.removeLayer(tempMarker);
  tempMarker = L.circleMarker([lat, lng], {
    radius: 9, color: '#4b3a8e', fillColor: '#4b3a8e', fillOpacity: .4
  }).addTo(map);
  map.panTo([lat, lng]);
}

function makeIcon(n, isStart) {
  const bg = isStart ? '#10b981' : '#4b3a8e';
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;
      font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">${n}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  });
}

// ── Load existing ──────────────────────────────────────────────────────────
function loadExistingLocations() {
  const locs = DB.getLocationsByStory(storyId);
  locs.forEach(l => addMarker(l));
  drawRoute(locs);
  renderList(locs);
}

function addMarker(loc) {
  if (!loc.lat || !loc.lng) return;
  if (markers[loc.id]) map.removeLayer(markers[loc.id]);
  const m = L.marker([loc.lat, loc.lng], { icon: makeIcon(loc.orderId, loc.orderId === 1) })
    .addTo(map)
    .bindPopup(`<b>#${loc.orderId} ${escapeHtml(loc.name)}</b><br>${escapeHtml(loc.address)}`);
  markers[loc.id] = m;
}

function drawRoute(locs) {
  if (routeLine) map.removeLayer(routeLine);
  const pts = locs.filter(l => l.lat && l.lng).map(l => [l.lat, l.lng]);
  if (pts.length >= 2) {
    routeLine = L.polyline(pts, { color: '#4b3a8e', weight: 3, dashArray: '6 8', opacity: .7 }).addTo(map);
  }
}

function fitMap(locs) {
  const pts = locs.filter(l => l.lat && l.lng).map(l => [l.lat, l.lng]);
  if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
}

// ── Completion % ───────────────────────────────────────────────────────────
function computeCompletion(locId, type) {
  const d = DB.getLocationDetails(storyId, locId);
  if (!d) return 0;
  if (type === 'T3') {
    const fields = ['direction', 'nonfiction'];
    const done   = fields.filter(f => d[f] && d[f].length > 0).length;
    return Math.round((done / fields.length) * 100);
  }
  const fields = ['direction', 'challenge', 'answer', 'hint', 'nonfiction'];
  const done   = fields.filter(f => (f === 'answer' && d.answerType === 'photo') || d[f]?.length > 0).length;
  return Math.round((done / fields.length) * 100);
}

// ── Haversine distance (metres) ────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R    = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat/2)**2 +
               Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function fmtDist(m) {
  return m >= 1000 ? `${(m/1000).toFixed(1)}km` : `${m}m`;
}

// ── Render list ────────────────────────────────────────────────────────────
function renderList(locs) {
  const list  = document.getElementById('locationList');
  const badge = document.getElementById('savedCount');

  // Total route distance
  let totalDist = 0;
  locs.forEach((l, i) => {
    if (i > 0) {
      const d = haversine(locs[i-1].lat, locs[i-1].lng, l.lat, l.lng);
      if (d) totalDist += d;
    }
  });
  const distLabel = totalDist > 0 ? ` (${fmtDist(totalDist)})` : '';
  badge.textContent = `${locs.length} of min. ${MIN_LOCS}${distLabel}`;

  if (!locs.length) {
    list.innerHTML = `<li style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">
      No locations yet. Click the map or type an address to add your first stop.
    </li>`;
    updateChecklist(locs);
    return;
  }

  list.innerHTML = '';
  locs.forEach((loc, idx) => {
    // Distance from previous
    if (idx > 0) {
      const prev = locs[idx - 1];
      const dist = haversine(prev.lat, prev.lng, loc.lat, loc.lng);
      if (dist !== null) {
        const ok  = dist <= MAX_DIST;
        const div = document.createElement('div');
        div.className = `loc-dist-row ${ok ? 'ok' : 'warn'}`;
        div.innerHTML = `
          <span class="loc-dist-line"></span>
          <span class="loc-dist-badge">
            Distance: ${fmtDist(dist)} ${ok ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>'}
          </span>
          <span class="loc-dist-line"></span>`;
        list.appendChild(div);

        if (!ok) {
          const warn = document.createElement('div');
          warn.className = 'loc-dist-warn-msg';
          warn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Make sure the distance is less than 550m`;
          list.appendChild(warn);
        }
      }
    }

    const pct    = computeCompletion(loc.id, storyType);
    const isStart= loc.orderId === 1;
    const done   = pct === 100;

    // Map thumbnail URL (static OpenStreetMap)
    const thumbSrc = (loc.lat && loc.lng)
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${loc.lat},${loc.lng}&zoom=16&size=80x80&markers=color:red%7C${loc.lat},${loc.lng}&key=DEMO`
      : '';
    // Fallback: styled placeholder
    const thumbHtml = `
      <div class="loc-thumb" style="background:linear-gradient(135deg,#e0e7ff,#c7d2fe);">
        <span class="loc-thumb-num">${loc.orderId}</span>
        ${loc.lat && loc.lng
          ? `<img src="https://staticmap.openstreetmap.de/staticmap.php?center=${loc.lat},${loc.lng}&zoom=16&size=60x60&markers=${loc.lat},${loc.lng},red-pushpin"
               style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:6px;"
               onerror="this.remove()" alt="map">`
          : ''}
      </div>`;

    const li = document.createElement('li');
    li.className = 'loc-card';
    li.dataset.id = loc.id;
    li.innerHTML = `
      <div class="loc-card-inner">
        ${thumbHtml}
        <div class="loc-card-body">
          <div class="loc-card-toprow">
            <span class="loc-num-label">Location #${loc.orderId}</span>
            ${isStart ? '<span class="loc-start-chip"><i class="fa-solid fa-flag"></i> Starting point</span>' : ''}
            <button class="loc-menu-btn" data-id="${loc.id}" title="Options">⋮</button>
          </div>
          <div class="loc-card-name">${escapeHtml(loc.name)}</div>
          <div class="loc-card-addr">${escapeHtml(loc.address || '—')}</div>
          <div class="loc-completion-row">
            <div class="loc-completion-bar" style="width:${pct}%"></div>
            <span class="loc-completion-pct">${pct}% completion</span>
          </div>
          <a href="location.html?locId=${loc.id}&storyId=${storyId}"
             class="loc-detail-btn ${done ? 'done' : ''}">
            ${done ? 'Edit details' : 'Add details'}
          </a>
        </div>
      </div>`;
    list.appendChild(li);

    // Three-dot menu
    li.querySelector('.loc-menu-btn').addEventListener('click', e => {
      e.stopPropagation();
      showLocMenu(loc.id, e.currentTarget);
    });
  });

  updateChecklist(locs);
}

// ── Three-dot context menu ─────────────────────────────────────────────────
let openMenu = null;
function showLocMenu(locId, btn) {
  if (openMenu) openMenu.remove();

  const menu = document.createElement('div');
  menu.className = 'loc-context-menu';
  menu.innerHTML = `
    <button class="lcm-item" data-action="delete">
      <i class="fa-solid fa-trash"></i> Remove location
    </button>`;

  const rect = btn.getBoundingClientRect();
  menu.style.cssText = `
    position:fixed;top:${rect.bottom + 4}px;left:${rect.left - 120}px;
    background:#fff;border:1px solid #e5e7eb;border-radius:8px;
    box-shadow:0 8px 20px rgba(0,0,0,.12);z-index:1000;min-width:160px;overflow:hidden;`;
  document.body.appendChild(menu);
  openMenu = menu;

  menu.querySelector('[data-action=delete]').addEventListener('click', () => {
    menu.remove(); openMenu = null;
    deleteLocation(locId);
  });

  const close = e => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); openMenu = null; document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 10);
}

// ── Form ───────────────────────────────────────────────────────────────────
function initForm() {
  document.getElementById('routeForm').addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('locName').value.trim();
    const address = document.getElementById('locAddress').value.trim();
    if (!name)    { alert('Please enter a location name.'); return; }
    if (!address) { alert('Please enter or select an address.'); return; }

    const locs = DB.getLocationsByStory(storyId);
    if (locs.length >= MAX_LOCS) { alert(`Maximum ${MAX_LOCS} locations allowed.`); return; }

    const nextOrder = locs.length ? Math.max(...locs.map(l => l.orderId)) + 1 : 1;
    const loc = DB.createLocation({
      name, address, storyId, orderId: nextOrder,
      lat: selectedLatLng?.lat ?? null,
      lng: selectedLatLng?.lng ?? null,
    });

    document.getElementById('routeForm').reset();
    document.getElementById('addrDropdown').style.display = 'none';
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    selectedLatLng = null;

    const allLocs = DB.getLocationsByStory(storyId);
    addMarker(loc);
    drawRoute(allLocs);
    renderList(allLocs);
    if (loc.lat && loc.lng) fitMap(allLocs);
  });

  // Saved locations collapse toggle
  const toggle = document.getElementById('savedToggle');
  const list   = document.getElementById('locationList');
  toggle.addEventListener('click', () => {
    const collapsed = toggle.classList.toggle('collapsed');
    list.style.display = collapsed ? 'none' : '';
    toggle.querySelector('i').style.transform = collapsed ? 'rotate(180deg)' : '';
  });
}

// ── Address search ─────────────────────────────────────────────────────────
function initAddrSearch() {
  const input    = document.getElementById('locAddress');
  const dropdown = document.getElementById('addrDropdown');
  let debounce;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    dropdown.innerHTML = ''; dropdown.style.display = 'none';
    if (q.length < 3) return;
    debounce = setTimeout(() => geocode(q), 420);
  });
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target))
      dropdown.style.display = 'none';
  });
}

async function geocode(q) {
  const dropdown = document.getElementById('addrDropdown');
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { Accept: 'application/json' } }
    );
    const data = await res.json();
    if (!data.length) return;
    dropdown.innerHTML = data.map(r =>
      `<li class="addr-opt" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name}">
        <i class="fa-solid fa-location-dot"></i> ${r.display_name}
      </li>`
    ).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.addr-opt').forEach(li => {
      li.addEventListener('click', () => {
        const lat = parseFloat(li.dataset.lat);
        const lng = parseFloat(li.dataset.lng);
        document.getElementById('locAddress').value = li.dataset.name;
        dropdown.style.display = 'none';
        setTempPin(lat, lng);
        map.flyTo([lat, lng], 16);
        document.getElementById('mapTip').style.opacity = '0';
      });
    });
  } catch { /* ignore */ }
}

// ── Cover ──────────────────────────────────────────────────────────────────
function initCoverSection(story) {
  document.getElementById('setCoverBtn').addEventListener('click', () => {
    const url = document.getElementById('coverUrlInput').value.trim();
    if (url) showCoverPreview(url);
  });
  document.getElementById('removeCoverBtn').addEventListener('click', () => {
    document.getElementById('coverPreviewArea').style.display = 'none';
    document.getElementById('coverUrlInput').value = '';
    DB.updateStory(storyId, { coverPhoto: null });
  });
  document.getElementById('saveCoverBtn').addEventListener('click', () => {
    const img = document.getElementById('coverPreviewImg');
    DB.updateStory(storyId, { coverPhoto: img.src || null });
    const btn = document.getElementById('saveCoverBtn');
    btn.textContent = '✅ Saved!'; btn.classList.add('saved');
    setTimeout(() => { btn.textContent = 'Save images'; btn.classList.remove('saved'); }, 2000);
  });
}

function showCoverPreview(url) {
  document.getElementById('coverUrlInput').value = url;
  document.getElementById('coverPreviewImg').src = url;
  document.getElementById('coverPreviewArea').style.display = 'block';
}

// ── Delete ─────────────────────────────────────────────────────────────────
function deleteLocation(id) {
  if (!confirm('Remove this location?')) return;
  if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
  DB.deleteLocation(id);
  const locs = DB.getLocationsByStory(storyId);
  Object.values(markers).forEach(m => map.removeLayer(m));
  Object.keys(markers).forEach(k => delete markers[k]);
  locs.forEach(l => addMarker(l));
  drawRoute(locs);
  renderList(locs);
}

// ── Requirements checklist ─────────────────────────────────────────────────
function updateChecklist(locs) {
  const enough = locs.length >= MIN_LOCS;
  const el = document.getElementById('check-count');
  if (el) {
    el.innerHTML = `
      <i class="fa-solid ${enough ? 'fa-check check-tick' : 'fa-xmark check-cross'}"></i>
      You have added sufficient locations (min ${MIN_LOCS} - max ${MAX_LOCS}) — ${locs.length} added`;
  }

  const btn = document.getElementById('completeStepBtn');
  if (btn) {
    btn.classList.toggle('done', enough);
    btn.onclick = () => {
      if (enough) window.location.href = `workspace.html?id=${storyId}`;
      else alert(`Add at least ${MIN_LOCS} locations to complete this step.`);
    };
  }
}
