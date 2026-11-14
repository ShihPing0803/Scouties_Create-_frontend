const userId  = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const params  = new URLSearchParams(location.search);
const storyId = params.get('id');
const locId   = params.get('locId'); // present when editing a specific location's fiction
if (!storyId) window.location.href = 'dashboard.html';

DB.ready.then(() => {
  const story = DB.getStoryById(storyId);
  if (!story) { window.location.href = 'dashboard.html'; return; }

  if (locId) {
    buildLocationView(story);
  } else {
    buildMainView(story);
  }
});

// ── MAIN VIEW: Storyline + location list + map ─────────────────────────────
function buildMainView(story) {
  const locs = DB.getLocationsByStory(storyId);

  // Header
  document.getElementById('fcHeader').innerHTML = `
    <div class="fc-header-left">
      <a href="workspace.html?id=${storyId}" class="fc-nav-link">
        <i class="fa-solid fa-chevron-left"></i> Workspace
      </a>
    </div>
    <a href="#" class="fc-preview-btn">
      <i class="fa-solid fa-mobile-screen"></i> Preview game
    </a>`;

  // Layout: left panel + map
  document.getElementById('fcLayout').innerHTML = `
    <div class="fc-left" id="fcLeft"></div>
    <div class="fc-map-col"><div id="fcMap"></div></div>`;

  // Left content
  const left = document.getElementById('fcLeft');
  left.innerHTML = `
    <div class="fc-page-title">Fiction</div>
    <div class="fc-page-sub">Begin crafting the fictional narrative of your game.</div>

    <!-- Storyline section -->
    <div class="fc-section">
      <div class="fc-section-title">
        Storyline
        <a href="#">Learn more</a>
      </div>
      <p class="fc-section-hint">
        Create a short introduction to the plot, outlining the main character and the mission they need to accomplish.
      </p>
      <textarea id="storylineField" class="fc-textarea ${!(story.storyline && story.storyline.length >= 300) ? 'error' : ''}"
        placeholder="Write the opening storyline for your game…" style="min-height:160px;">${escapeHtml(story.storyline || '')}</textarea>
      <div class="fc-char-count"><span id="slCount">${(story.storyline||'').length}</span> / 350</div>
      <div class="fc-char-min" id="slMin">${(story.storyline||'').length < 300 ? '300 minimum characters required' : ''}</div>

      <div class="fc-upload-label">Add multimedia for the storyline (optional)</div>
      <p class="fc-upload-hint">Allowed formats: jpg, jpeg, png, mp3, mp4</p>
      <div class="fc-dropzone">Drag and drop your files here or<br><button class="fc-choose-btn">choose files</button></div>

      <p class="fc-upload-sound">Background sound (will be played on the background while reading). Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>

      <p class="fc-upload-sound">Voice-over – include an audio file so players can listen to a recorded narration of the text. Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>

      <div class="fc-save-row">
        <button class="fc-save-btn" id="saveStorylineBtn">
          <i class="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>

    <!-- Location list -->
    <div class="fc-loc-list" id="fcLocList"></div>`;

  // Char counter
  const slField = document.getElementById('storylineField');
  const slCount = document.getElementById('slCount');
  const slMin   = document.getElementById('slMin');
  slField.addEventListener('input', () => {
    const n = slField.value.length;
    slCount.textContent = n;
    slMin.textContent   = n < 300 ? '300 minimum characters required' : '';
    slField.classList.toggle('error', n > 0 && n < 300);
  });

  const collectMedia = MediaEditor.bind('.fc-dropzone', [
    ['storyline'], ['storyline', 'background'], ['storyline', 'voiceover']
  ], story.media);
  document.getElementById('saveStorylineBtn').addEventListener('click', async () => {
    try {
      DB.updateStory(storyId, {storyline:slField.value.trim(), media:await collectMedia()});
      showToast('Storyline saved!');
    } catch (error) { alert(error.message); }
  });

  // Location list
  renderLocList(locs);

  // Map
  initMainMap(locs);
}

function renderLocList(locs) {
  const list = document.getElementById('fcLocList');
  if (!locs.length) {
    list.innerHTML = `<p style="font-size:13px;color:#9ca3af;padding:12px;">
      Add locations in Step 2 to appear here.</p>`;
    return;
  }

  list.innerHTML = locs.map(loc => {
    const d    = DB.getLocationDetails(storyId, loc.id) || {};
    const pct  = fictionCompletion(d);
    const done = pct === 100;
    return `
      <div class="fc-loc-card">
        <div class="fc-loc-card-top">
          <div class="fc-loc-card-info">
            <div class="fc-loc-name">${escapeHtml(loc.name)}</div>
            <div class="fc-loc-city">${cityOf(loc.address)}</div>
            <div class="fc-loc-addr">${escapeHtml(loc.address || '')}</div>
          </div>
          <span class="fc-loc-num">Location #${loc.orderId}</span>
        </div>
        <div class="fc-loc-pct">${pct}% completion</div>
        <a href="fiction.html?id=${storyId}&locId=${loc.id}"
           class="fc-add-fiction-btn ${done ? 'done' : ''}">
          ${done ? 'Edit fiction' : 'Add fiction'}
        </a>
      </div>`;
  }).join('');
}

function fictionCompletion(d) {
  if (!d) return 0;
  const filled = ['intro', 'outro'].filter(k => d[k] && d[k].length > 0).length;
  return Math.round((filled / 2) * 100);
}

function cityOf(addr) {
  if (!addr) return '';
  const parts = addr.split(',');
  return parts.slice(0, 2).join(',').trim();
}

function initMainMap(locs) {
  const map = L.map('fcMap').setView([25.033, 121.565], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const pts = [];
  locs.forEach(loc => {
    if (!loc.lat || !loc.lng) return;
    pts.push([loc.lat, loc.lng]);
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:26px;height:26px;border-radius:50%;background:#4b3a8e;color:#fff;
        font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">${loc.orderId}</div>`,
      iconSize: [26, 26], iconAnchor: [13, 13]
    });
    L.marker([loc.lat, loc.lng], { icon }).addTo(map)
      .bindPopup(`<b>#${loc.orderId} ${escapeHtml(loc.name)}</b>`);
  });

  if (pts.length >= 2) {
    L.polyline(pts, { color: '#4b3a8e', weight: 3, dashArray: '6 8', opacity: .7 }).addTo(map);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
  } else if (pts.length === 1) {
    map.setView(pts[0], 14);
  }
}

// ── LOCATION VIEW: Intro + Challenge + Answer + Outro ─────────────────────
function buildLocationView(story) {
  const loc   = DB.getLocationById(locId);
  if (!loc) { window.location.href = `fiction.html?id=${storyId}`; return; }

  const locs   = DB.getLocationsByStory(storyId);
  const detail = DB.getLocationDetails(storyId, locId) || {};

  // Header with tabs
  document.getElementById('fcHeader').innerHTML = `
    <div class="fc-header-left">
      <a href="fiction.html?id=${storyId}" class="fc-nav-link">
        <i class="fa-solid fa-chevron-left"></i> Fiction part
      </a>
      <div class="fc-tabs" id="fcTabs"></div>
    </div>
    <a href="#" class="fc-preview-btn">
      <i class="fa-solid fa-mobile-screen"></i> Preview game
    </a>`;

  buildTabs(locs, loc);

  // Layout: left editor + right phone
  document.getElementById('fcLayout').innerHTML = `
    <div class="fc-left" id="fcLeft"></div>
    <div class="fc-phone-col">
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>9:41</span>
          <div class="phone-icons">
            <i class="fa-solid fa-signal"></i>
            <i class="fa-solid fa-wifi"></i>
            <i class="fa-solid fa-battery-full"></i>
          </div>
        </div>
        <div class="phone-stats-bar">
          <span class="ph-stat ph-stat-loc"><i class="fa-solid fa-location-dot"></i> 1/10</span>
          <span class="ph-stat ph-stat-xp"><i class="fa-solid fa-star"></i> 0-10</span>
          <span class="ph-stat ph-stat-pts"><i class="fa-solid fa-bolt"></i> 3100</span>
        </div>
        <div class="phone-body" id="phoneBody">
          <div class="ph-placeholder">
            <i class="fa-solid fa-book-open"></i>
            <p>Fiction preview appears here</p>
          </div>
        </div>
      </div>
    </div>`;

  buildEditor(loc, detail, story.type);
}

function buildTabs(locs, current) {
  const container = document.getElementById('fcTabs');
  locs.forEach(l => {
    const d    = DB.getLocationDetails(storyId, l.id) || {};
    const done = fictionCompletion(d) === 100;
    const a    = document.createElement('a');
    a.href      = `fiction.html?id=${storyId}&locId=${l.id}`;
    a.className = `fc-tab${l.id === locId ? ' active' : ''}${done ? ' done' : ''}`;
    a.textContent = `#${l.orderId} – ${l.name}`;
    container.appendChild(a);
  });
}

function buildEditor(loc, detail, type) {
  const left    = document.getElementById('fcLeft');
  const isStart = loc.orderId === 1;
  const locs    = DB.getLocationsByStory(storyId);
  const nextLoc = locs.find(l => l.orderId === loc.orderId + 1);
  const chalLabel = type === 'T1' ? 'Clue' : 'Challenge';

  left.innerHTML = `
    <!-- Chapter heading -->
    <div class="fc-chapter-heading">
      <div class="fc-chapter-num">Chapter ${loc.orderId}</div>
      <div class="fc-chapter-addr">${escapeHtml(loc.name)}</div>
    </div>

    <!-- INTRO -->
    <div class="fc-section">
      <div class="fc-section-title">
        Intro
        <a href="#">Learn more</a>
      </div>
      <p class="fc-section-hint">
        Add the first half of the fiction for this checkpoint.
        This is going to show up in the <em>"Into the story"</em> section in the app.
      </p>
      <textarea id="introField" class="fc-textarea" style="min-height:140px;"
        placeholder="Write the intro fiction for this checkpoint…">${escapeHtml(detail.intro || '')}</textarea>
      <div class="fc-char-count"><span id="introCount">${(detail.intro||'').length}</span> / 350</div>

      <div class="fc-upload-label">Intro files</div>
      <p class="fc-upload-hint">Add a photo or video to accompany the intro section. Allowed formats: jpg, jpeg, png, mp3, mp4</p>
      <div class="fc-dropzone">Drag and drop your files here or<br><button class="fc-choose-btn">choose files</button></div>
      <p class="fc-upload-sound">Background sound (will be played on the background while reading). Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>
      <p class="fc-upload-sound">Text reading (upload a voice-over file, so the players can listen to a narration of this section). Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>
    </div>

    ${type !== 'T3' ? `
    <!-- CHALLENGE (read-only) -->
    <div class="fc-section">
      <div class="fc-section-title">${chalLabel}</div>
      <div class="fc-readonly-box">
        The ${chalLabel} is included here as a reminder to use the answer in your Outro.<br><br>
        If you want to amend the challenge at this stage, you must go back to
        <a href="completeRoute.html?id=${storyId}">the previous step</a> and edit it there.
      </div>
      <div class="fc-effects-row" style="margin-bottom:8px;">
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px;">Effect</div>
        <input type="text" class="fc-readonly-field" value="${escapeHtml(detail.effect || 'Standard')}" readonly>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px;">Description</div>
        <input type="text" class="fc-readonly-field" value="${escapeHtml(detail.challenge || '')}" readonly>
      </div>
    </div>

    <!-- ANSWER (read-only) -->
    <div class="fc-section">
      <div class="fc-section-title">Answer</div>
      <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:6px;">Answer type:</div>
      <input type="text" class="fc-readonly-field" value="${detail.answerType === 'multiple' ? 'Multiple choice' : 'Simple type form'}" readonly style="margin-bottom:10px;">
      <div class="fc-readonly-box">
        The Answer is added here only as a reminder of what it includes. If you want to change it at this stage,
        you must go back to <a href="completeRoute.html?id=${storyId}">the previous step</a> and edit there.
      </div>
      <div class="fc-correct-label">
        <i class="fa-solid fa-circle-check"></i> Correct answer
      </div>
      <input type="text" class="fc-readonly-field" value="${escapeHtml(detail.answer || '')}" readonly>
    </div>
    ` : ''}

    <!-- OUTRO -->
    <div class="fc-section">
      <div class="fc-section-title">
        Outro
        <a href="#">Learn more</a>
      </div>
      <p class="fc-section-hint">Add the other half of the fiction for this checkpoint.</p>
      <p class="fc-section-note">Remember to include a strong connection to the challenge answer in the fiction.</p>
      <p class="fc-section-note">This section is going to show up in the "Back to the story" section in the app, after the users solve the challenge.</p>
      <textarea id="outroField" class="fc-textarea" style="min-height:140px;"
        placeholder="Write the outro fiction for this checkpoint…">${escapeHtml(detail.outro || '')}</textarea>
      <div class="fc-char-count"><span id="outroCount">${(detail.outro||'').length}</span> / 350</div>

      <div class="fc-upload-label">Outro files</div>
      <p class="fc-upload-hint">Add a photo or video to accompany the outro section. Allowed formats: jpg, jpeg, png, mp3, mp4</p>
      <div class="fc-dropzone">Drag and drop your files here or<br><button class="fc-choose-btn">choose files</button></div>
      <p class="fc-upload-sound">Background sound (will be played on the background while reading). Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>
      <p class="fc-upload-sound">Text reading (upload a voice-over file). Allowed format: mp3</p>
      <div class="fc-dropzone">Drag and drop your file here or<br><button class="fc-choose-btn">choose file</button></div>

      <!-- Requirements checklist -->
      <div class="fc-checklist-box">
        <p><i class="fa-solid fa-circle-info" style="margin-right:6px;"></i> Make sure that:</p>
        <ul>
          <li><i class="fa-solid fa-check"></i> Your INTRO is interesting</li>
          <li><i class="fa-solid fa-check"></i> Your Challenge answer has a strong connection in your OUTRO</li>
          <li><i class="fa-solid fa-check"></i> Your OUTRO includes the character moving towards the next place</li>
        </ul>
      </div>

      <div class="fc-save-row">
        <button class="fc-save-btn" id="saveBtn">Save</button>
      </div>
    </div>

    <!-- Sticky bar -->
    <div class="fc-sticky-bar">
      <button class="fc-save-btn" id="saveBtnSticky">Save changes</button>
      <div class="fc-save-feedback" id="saveFeedback">
        <i class="fa-solid fa-circle-check"></i> Saved!
      </div>
      ${nextLoc
        ? `<a href="fiction.html?id=${storyId}&locId=${nextLoc.id}" style="margin-left:auto;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;">
             Next: ${nextLoc.name} <i class="fa-solid fa-arrow-right"></i>
           </a>`
        : `<a href="fiction.html?id=${storyId}" style="margin-left:auto;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;">
             Done — back to Fiction <i class="fa-solid fa-arrow-right"></i>
           </a>`}
    </div>`;

  // Char counters + live preview
  bindCounter('introField', 'introCount');
  bindCounter('outroField', 'outroCount');

  document.getElementById('introField').addEventListener('input', updatePreview);
  document.getElementById('outroField').addEventListener('input', updatePreview);
  updatePreview();

  // Save
  const collectMedia = MediaEditor.bind('.fc-dropzone', [
    ['intro'], ['intro', 'background'], ['intro', 'voiceover'],
    ['outro'], ['outro', 'background'], ['outro', 'voiceover']
  ], detail.media);
  const doSave = async () => {
    const intro = document.getElementById('introField').value.trim();
    const outro = document.getElementById('outroField').value.trim();
    try {
      const media = await collectMedia();
      DB.upsertLocationDetails({
        ...detail, storyId, locId, orderId:loc.orderId, intro, outro, media
      });
    } catch (error) { alert(error.message); return; }
    document.getElementById('saveFeedback').classList.add('show');
    setTimeout(() => document.getElementById('saveFeedback').classList.remove('show'), 2500);
    // Refresh tabs
    document.getElementById('fcTabs').innerHTML = '';
    buildTabs(DB.getLocationsByStory(storyId), loc);
  };

  document.getElementById('saveBtn').addEventListener('click', doSave);
  document.getElementById('saveBtnSticky').addEventListener('click', doSave);
}

// ── Phone preview ──────────────────────────────────────────────────────────
function updatePreview() {
  const body  = document.getElementById('phoneBody');
  if (!body) return;
  const intro = (document.getElementById('introField')?.value || '').trim();
  const outro = (document.getElementById('outroField')?.value || '').trim();

  if (!intro && !outro) {
    body.innerHTML = `<div class="ph-placeholder">
      <i class="fa-solid fa-book-open"></i>
      <p>Fiction preview appears here</p>
    </div>`;
    return;
  }

  body.innerHTML = `
    ${intro ? `<div class="ph-block">
      <div class="ph-label">Intro — Into the story</div>
      <div class="ph-text">${esc(intro)}</div>
    </div>` : ''}
    ${outro ? `<div class="ph-block">
      <div class="ph-label">Outro — Back to the story</div>
      <div class="ph-text">${esc(outro)}</div>
    </div>` : ''}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function bindCounter(fieldId, countId) {
  const ta = document.getElementById(fieldId);
  const ct = document.getElementById(countId);
  if (!ta || !ct) return;
  ta.addEventListener('input', () => { ct.textContent = ta.value.length; });
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .slice(0, 150) + (s.length > 150 ? '…' : '');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:99px;
    font-size:13px;font-weight:600;z-index:9999;
    animation:fadeIn .2s ease;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
