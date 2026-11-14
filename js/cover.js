const userId  = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const storyId = new URLSearchParams(location.search).get('id');
if (!storyId) window.location.href = 'dashboard.html';

// ── Predefined "Good to know" tags ────────────────────────────────────────
const ALL_TAGS = [
  // Genres / themes
  { id: 'murder-mystery',   label: 'Murder Mystery' },
  { id: 'mystery',          label: 'Mystery' },
  { id: 'horror-haunts',    label: 'Horror & haunts' },
  { id: 'step-into-story',  label: 'Step into the Story' },
  { id: 'hidden-history',   label: 'Hidden History' },
  { id: 'squad-challenge',  label: 'Squad Challenge' },
  { id: 'kids-favorite',    label: "Kids' Favorite" },
  { id: 'romantic',         label: 'Romantic Adventure' },
  { id: 'couples',          label: 'Loved by couples' },
  { id: 'family',           label: 'Family favourite' },
  { id: 'audio-stories',    label: 'Audio Stories' },
  // Difficulty
  { id: 'diff-easy',        label: 'Difficulty level: Easy 😊📱',     cls: 'diff-easy' },
  { id: 'diff-medium',      label: 'Difficulty level: Medium 😊📱',   cls: 'diff-medium' },
  { id: 'diff-advanced',    label: 'Difficulty level: ADVANCED 😰📱', cls: 'diff-advanced' },
  // Tips / info
  { id: 'no-fiction',       label: "This game doesn't include stories about places." },
  { id: 'after-sunset',     label: 'You can play anytime, but we recommend after sunset.' },
  { id: 'after-5pm',        label: 'The last part of the game might not be available after 5PM.' },
  { id: 'morning-best',     label: 'Best in the morning to avoid the heat and see lively market, local shrines and temples.' },
  { id: 'dress-impress',    label: 'Dress to impress: Remember to dress respectfully when visiting temples for a seamless experience.' },
  { id: 'charge-phone',     label: 'Ensure your phone is fully charged or bring along your trusty power bank.' },
  { id: 'not-elderly',      label: 'Not suitable for young children or elderly people, due to the heat.' },
  { id: 'hat-sunscreen',    label: 'Wear a hat and sunscreen, have enough water.' },
  { id: 'avoid-heat',       label: 'Best in the morning to avoid the heat' },
  { id: 'river-high',       label: "Don't attempt when the river is high" },
];

DB.ready.then(init);

function init() {
  document.getElementById('backLink').href = `workspace.html?id=${storyId}`;

  const story = DB.getStoryById(storyId);
  if (!story) { window.location.href = 'dashboard.html'; return; }

  // Pre-fill fields
  const overviewField    = document.getElementById('overviewField');
  const highlightsField  = document.getElementById('highlightsField');
  overviewField.value   = story.overview   || '';
  highlightsField.value = story.highlights || '';

  updateCounter('overviewField',   'overviewCount',   'overviewMin',   30);
  updateCounter('highlightsField', 'highlightsCount', 'highlightsMin', 100);

  // Live counters + validation
  overviewField.addEventListener('input',   () => updateCounter('overviewField',   'overviewCount',   'overviewMin',   30));
  highlightsField.addEventListener('input', () => updateCounter('highlightsField', 'highlightsCount', 'highlightsMin', 100));

  // Tags
  const selected = new Set(story.goodToKnow || []);
  renderTags(selected);

  // Cover
  if (story.coverPhoto) addCoverThumb(story.coverPhoto, true);

  document.getElementById('setCoverBtn').addEventListener('click', () => {
    const url = document.getElementById('coverUrlInput').value.trim();
    if (url) addCoverThumb(url, true);
  });

  // ETC: sum all location ETC values
  calcETC();

  // Save
  document.getElementById('saveBtn').addEventListener('click', () => doSave(story, selected));

  // Complete step
  document.getElementById('completeBtn').addEventListener('click', () => {
    doSave(story, selected);
    setTimeout(() => { window.location.href = `workspace.html?id=${storyId}`; }, 400);
  });
}

// ── Counters + validation ──────────────────────────────────────────────────
function updateCounter(fieldId, countId, minId, minLen) {
  const field = document.getElementById(fieldId);
  const count = document.getElementById(countId);
  const minEl = document.getElementById(minId);
  const n     = field.value.length;
  count.textContent = n;
  const underMin = n > 0 && n < minLen;
  field.classList.toggle('error', underMin);
  if (minEl) minEl.style.visibility = (n === 0 || underMin) ? 'visible' : 'hidden';
}

// ── Tags ───────────────────────────────────────────────────────────────────
function renderTags(selected) {
  const container = document.getElementById('tagsContainer');
  container.innerHTML = '';
  ALL_TAGS.forEach(tag => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.textContent = tag.label;
    btn.className = `ft-tag${tag.cls ? ' ' + tag.cls : ''}${selected.has(tag.id) ? ' selected' : ''}`;
    btn.addEventListener('click', () => {
      if (selected.has(tag.id)) { selected.delete(tag.id); btn.classList.remove('selected'); }
      else                       { selected.add(tag.id);    btn.classList.add('selected'); }
    });
    container.appendChild(btn);
  });
}

// ── Cover thumbs ───────────────────────────────────────────────────────────
let selectedCoverUrl = null;

function addCoverThumb(url, isSelected) {
  const container = document.getElementById('coverThumbs');
  // Remove existing selection
  container.querySelectorAll('.ft-cover-thumb').forEach(t => t.classList.remove('selected'));

  // Check if this URL already has a thumb
  let existing = null;
  container.querySelectorAll('.ft-cover-thumb').forEach(t => {
    if (t.dataset.url === url) existing = t;
  });

  if (existing) {
    if (isSelected) { existing.classList.add('selected'); selectedCoverUrl = url; }
    return;
  }

  const div = document.createElement('div');
  div.className = `ft-cover-thumb${isSelected ? ' selected' : ''}`;
  div.dataset.url = url;

  const img = document.createElement('img');
  img.src = url;
  img.onerror = () => div.remove();
  div.appendChild(img);

  div.addEventListener('click', () => {
    container.querySelectorAll('.ft-cover-thumb').forEach(t => t.classList.remove('selected'));
    div.classList.add('selected');
    selectedCoverUrl = url;
  });

  container.appendChild(div);
  if (isSelected) selectedCoverUrl = url;
}

// ── ETC calc ───────────────────────────────────────────────────────────────
function calcETC() {
  const locs  = DB.getLocationsByStory(storyId);
  const total = locs.reduce((sum, l) => {
    const d = DB.getLocationDetails(storyId, l.id);
    return sum + (d && d.etc ? Number(d.etc) : 0);
  }, 0);
  document.getElementById('etcDisplay').textContent =
    total > 0 ? `${total} minutes` : '— minutes';
}

// ── Save ───────────────────────────────────────────────────────────────────
function doSave(story, selected) {
  const overview   = document.getElementById('overviewField').value.trim();
  const highlights = document.getElementById('highlightsField').value.trim();

  // Get selected cover
  const coverEl = document.querySelector('.ft-cover-thumb.selected');
  const cover   = coverEl ? coverEl.dataset.url : (story.coverPhoto || null);

  DB.updateStory(storyId, {
    overview,
    highlights,
    goodToKnow: Array.from(selected),
    coverPhoto: cover,
    pricing:    story.pricing || { model: 'free', price: 0, visibility: 'public' },
  });

  showToast();
}

function showToast() {
  const el = document.getElementById('saveToast');
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
}
