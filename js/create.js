// Auth guard
if (!sessionStorage.getItem('userId')) window.location.href = '../index.html';

const params  = new URLSearchParams(window.location.search);
const editId  = params.get('edit'); // present when editing an existing story

let map, cityMarker;

DB.ready.then(() => {
  initMap();
  initCitySearch();
  initCharCount();
  if (editId) prefillForm();
  initForm();
});

// ── Map ────────────────────────────────────────────────────────────────────
function initMap() {
  map = L.map('createMap', { zoomControl: true }).setView([20, 0], 2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

// ── City search autocomplete ───────────────────────────────────────────────
function initCitySearch() {
  const input    = document.getElementById('city');
  const dropdown = document.getElementById('cityDropdown');
  let debounce;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    if (q.length < 2) return;
    debounce = setTimeout(() => searchCity(q), 420);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target))
      dropdown.style.display = 'none';
  });
}

async function searchCity(q) {
  const dropdown = document.getElementById('cityDropdown');
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data.length) { dropdown.style.display = 'none'; return; }

    dropdown.innerHTML = data.map(r =>
      `<li class="city-opt" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name}">
        <i class="fa-solid fa-location-dot"></i> ${r.display_name}
      </li>`
    ).join('');
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.city-opt').forEach(li => {
      li.addEventListener('click', () => {
        const lat = parseFloat(li.dataset.lat);
        const lng = parseFloat(li.dataset.lng);
        document.getElementById('city').value = li.dataset.name;
        dropdown.style.display = 'none';
        if (cityMarker) map.removeLayer(cityMarker);
        cityMarker = L.marker([lat, lng]).addTo(map).bindPopup(li.dataset.name).openPopup();
        map.flyTo([lat, lng], 12);
      });
    });
  } catch {
    dropdown.style.display = 'none';
  }
}

// ── Character counter ──────────────────────────────────────────────────────
function initCharCount() {
  const textarea = document.getElementById('description');
  const counter  = document.querySelector('.char-count');
  if (!textarea || !counter) return;
  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length} / 350`;
  });
}

// ── Prefill form when editing ──────────────────────────────────────────────
function prefillForm() {
  const story = DB.getStoryById(editId);
  if (!story) return;

  document.getElementById('title').value       = story.title       || '';
  document.getElementById('city').value        = story.city        || '';
  document.getElementById('description').value = story.description || '';
  if (document.getElementById('difficulty'))
    document.getElementById('difficulty').value = story.difficulty || 'medium';
  if (document.getElementById('duration'))
    document.getElementById('duration').value   = story.duration   || '';
  if (document.getElementById('ageRating'))
    document.getElementById('ageRating').value  = story.ageRating  || 'all';

  const counter = document.querySelector('.char-count');
  if (counter) counter.textContent = `${(story.description || '').length} / 350`;

  document.querySelector('.submitBtn').textContent = 'Save Changes →';
  document.querySelector('.form-panel h2').textContent =
    document.querySelector('.form-panel h2').textContent.replace('Create', 'Edit');

  // Fly map to city if we can geocode it later
  if (story.cityLat && story.cityLng) {
    if (cityMarker) map.removeLayer(cityMarker);
    cityMarker = L.marker([story.cityLat, story.cityLng]).addTo(map);
    map.flyTo([story.cityLat, story.cityLng], 12);
  }
}

// ── Form submission ────────────────────────────────────────────────────────
function initForm() {
  const form      = document.getElementById('createForm');
  const submitBtn = document.querySelector('.submitBtn');
  const storyType = document.body.dataset.storyType;

  // Clear error on input
  form.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      const err = document.getElementById(el.id + 'Error');
      if (err) err.textContent = '';
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const title       = document.getElementById('title').value.trim();
    const city        = document.getElementById('city').value.trim();
    const description = document.getElementById('description').value.trim();
    const difficulty  = document.getElementById('difficulty')?.value || 'medium';
    const duration    = parseInt(document.getElementById('duration')?.value) || 0;
    const ageRating   = document.getElementById('ageRating')?.value || 'all';
    let valid = true;

    if (!title)       { document.getElementById('titleError').textContent = 'Please enter a game title.'; valid = false; }
    if (!city)        { document.getElementById('cityError').textContent  = 'Please select a city.';     valid = false; }
    if (!description) { document.getElementById('descError').textContent  = 'Please enter a description.'; valid = false; }
    if (!valid) return;

    submitBtn.textContent = 'Saving…';
    submitBtn.disabled    = true;

    const payload = { title, city, description, difficulty, duration, ageRating };

    if (editId) {
      // Editing existing story
      DB.updateStory(editId, payload);
      window.location.href = `../workspace.html?id=${editId}`;
    } else {
      // Creating new story
      const types = DB.getTypes();
      const type  = types.find(t => t.slug === storyType) || types[0];
      const story = DB.createStory({
        ...payload,
        type:   type.id,
        userId: sessionStorage.getItem('userId'),
        status: 'draft'
      });
      window.location.href = `../workspace.html?id=${story.id}`;
    }
  });
}
