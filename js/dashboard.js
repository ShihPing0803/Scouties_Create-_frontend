// Auth guard
const userId = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const TYPE_EMOJI = { T1: '🔍', T2: '⚔️', T3: '🗺️' };
const TYPE_ROUTE = {
  T1: 'create/scavenger-hunt.html',
  T2: 'create/quest.html',
  T3: 'create/exploration-tour.html'
};

let allStories    = [];
let activeFilter  = 'all';
let selectedTypeId = null;
let modalReady    = false;

// ── DOM-ready: wire up all static UI immediately (no DB needed) ───────────
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('importStoryFile');
  document.getElementById('importStoryBtn').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const status = document.getElementById('importStoryStatus');
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('The file must be smaller than 4 MB.');
      const bundle = StoryPackage.read(JSON.parse(await file.text()));
      await DB.ready;
      const story = DB.importStory(bundle, userId);
      window.location.href = 'workspace.html?id=' + encodeURIComponent(story.id);
    } catch (error) {
      status.textContent = 'Could not import this story. ' + error.message;
    } finally {
      fileInput.value = '';
    }
  };

  // Open modal
  document.getElementById('newStoryBtn').addEventListener('click', openModal);
  document.getElementById('emptyCreateBtn')?.addEventListener('click', openModal);

  // Close modal
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  // Search
  document.getElementById('searchBar').addEventListener('input', e => {
    renderStories(e.target.value.trim().toLowerCase());
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderStories(document.getElementById('searchBar').value.trim().toLowerCase());
    });
  });

  // Continue button in modal
  document.getElementById('continueBtn').addEventListener('click', () => {
    if (!selectedTypeId) return;
    window.location.href = TYPE_ROUTE[selectedTypeId];
  });
});

// ── DB-ready: load and render data ────────────────────────────────────────
DB.ready.then(() => {
  // If this userId doesn't exist in the DB (stale session from old server),
  // clear and redirect to login so the user can create a fresh session.
  const user = DB.getUserById(userId);
  if (!user) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('navName').textContent = user.name;
  if (user.avatar) document.getElementById('navAvatar').src = user.avatar;

  loadDashboard();
  populateModalTypes();
});

// ── Dashboard data ─────────────────────────────────────────────────────────
function loadDashboard() {
  allStories = DB.getStoriesByUser(userId);
  renderStats();
  renderStories('');
}

function renderStats() {
  const s = DB.getUserStats(userId);
  document.getElementById('statTotal').textContent     = s.total;
  document.getElementById('statPublished').textContent = s.published;
  document.getElementById('statPlays').textContent     = s.plays.toLocaleString();
  document.getElementById('statRevenue').textContent   = `$${s.revenue}`;
  document.getElementById('statRating').textContent    = s.avgRating;
}

function renderStories(query = '') {
  const list       = document.getElementById('storiesList');
  const emptyState = document.getElementById('emptyState');

  let stories = [...allStories];
  if (activeFilter !== 'all') stories = stories.filter(s => s.status === activeFilter);
  if (query) stories = stories.filter(s =>
    s.title.toLowerCase().includes(query) || s.city.toLowerCase().includes(query)
  );
  stories.sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (!stories.length) {
    list.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  list.innerHTML = stories.map(story => {
    const type  = DB.getTypeById(story.type) || {};
    const emoji = TYPE_EMOJI[story.type] || '📖';
    const locs  = DB.getLocationsByStory(story.id);
    const stats = story.statistics || {};

    return `<li class="story-card">
      <div class="story-type-icon">${emoji}</div>
      <div class="story-info">
        <div class="story-title">${escapeHtml(story.title)}</div>
        <div class="story-meta">
          <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(story.city)}</span>
          <span><i class="fa-solid fa-tag"></i> ${type.name || '–'}</span>
          <span><i class="fa-solid fa-map-pin"></i> ${locs.length} location${locs.length !== 1 ? 's' : ''}</span>
          <span><i class="fa-regular fa-clock"></i> ${story.last_update}</span>
        </div>
      </div>
      <span class="status-badge status-${story.status}">${statusLabel(story.status)}</span>
      <div class="story-stats">
        <div class="story-stat"><strong>${stats.plays || 0}</strong><small>Plays</small></div>
        <div class="story-stat"><strong>${stats.rating ? stats.rating.toFixed(1) : '–'}</strong><small>Rating</small></div>
        <div class="story-stat"><strong>$${stats.revenue || 0}</strong><small>Revenue</small></div>
      </div>
      <div class="story-actions">
        <a class="btn-view" href="workspace.html?id=${story.id}">
          <i class="fa-solid fa-pen-to-square"></i> Edit
        </a>
        <button class="btn-delete" onclick="deleteStory('${story.id}')" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </li>`;
  }).join('');
}

function statusLabel(status) {
  return { published: '✅ Published', draft: '📝 Draft', review: '🕐 In Review' }[status] || status;
}

window.deleteStory = function (id) {
  const story = DB.getStoryById(id);
  if (!story) return;
  if (!confirm(`Delete "${story.title}"? This cannot be undone.`)) return;
  DB.deleteStory(id);
  allStories = DB.getStoriesByUser(userId);
  renderStats();
  renderStories(document.getElementById('searchBar').value.trim().toLowerCase());
};

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal() {
  selectedTypeId = null;
  document.getElementById('continueBtn').disabled = true;

  // Reset selection state
  document.getElementById('typeList').querySelectorAll('button')
    .forEach(b => b.classList.remove('selected'));
  document.getElementById('typeIntro').innerHTML =
    '<p class="type-placeholder">← Select a type to see details</p>';

  document.getElementById('modalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function populateModalTypes() {
  if (modalReady) return;
  modalReady = true;

  const types    = DB.getTypes();
  const typeList = document.getElementById('typeList');
  const contBtn  = document.getElementById('continueBtn');

  typeList.innerHTML = '';
  types.forEach(t => {
    const li  = document.createElement('li');
    const btn = document.createElement('button');
    btn.dataset.id = t.id;
    btn.innerHTML  = `<span class="type-emoji">${TYPE_EMOJI[t.id] || '📖'}</span> ${t.name}`;
    btn.addEventListener('click', () => {
      typeList.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTypeId   = t.id;
      contBtn.disabled = false;
      renderTypeIntro(t);
    });
    li.appendChild(btn);
    typeList.appendChild(li);
  });
}

function renderTypeIntro(type) {
  document.getElementById('typeIntro').innerHTML = `
    <h3>${type.name}</h3>
    <p>${type.description}</p>
    <ul>${type.includes.map(i => `<li>${i}</li>`).join('')}</ul>`;
}
