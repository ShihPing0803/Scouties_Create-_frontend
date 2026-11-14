const userId  = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const params  = new URLSearchParams(location.search);
const locId   = params.get('locId');
const storyId = params.get('storyId');
if (!locId || !storyId) window.location.href = 'dashboard.html';

DB.ready.then(init);

function init() {
  const loc   = DB.getLocationById(locId);
  const story = DB.getStoryById(storyId);
  if (!loc || !story) { window.location.href = 'dashboard.html'; return; }

  const locs   = DB.getLocationsByStory(storyId);
  const detail = DB.getLocationDetails(storyId, locId) || {};

  document.getElementById('backToRoute').href = `completeRoute.html?id=${storyId}`;

  buildTabs(locs, loc, story);
  buildEditor(loc, story, locs, detail);
  updatePhonePreview(detail, story.type);
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function buildTabs(locs, current, story) {
  const container = document.getElementById('locTabs');
  locs.forEach(l => {
    const d    = DB.getLocationDetails(storyId, l.id) || {};
    const done = isComplete(d, story.type);
    const a    = document.createElement('a');
    a.href      = `location.html?locId=${l.id}&storyId=${storyId}`;
    a.className = `loc-tab${l.id === locId ? ' active' : ''}${done ? ' complete' : ''}`;
    a.textContent = `#${l.orderId} – ${l.name}`;
    container.appendChild(a);
  });
}

function isComplete(d, type) {
  if (!d) return false;
  return type === 'T3'
    ? !!(d.direction && d.nonfiction)
    : !!(d.direction && d.challenge && d.answer);
}

// ── Build editor ───────────────────────────────────────────────────────────
function buildEditor(loc, story, locs, detail) {
  const editor  = document.getElementById('locEditor');
  const isStart = loc.orderId === 1;
  const nextLoc = locs.find(l => l.orderId === loc.orderId + 1);
  const type    = story.type;
  const isT3    = type === 'T3';
  const chalLabel = type === 'T1' ? 'Clue' : 'Challenge';
  const chalHint  = type === 'T1'
    ? 'Create a visual clue that guides players to discover the hidden item.'
    : 'Look for real-world details around the selected location and create an engaging puzzle.';

  editor.innerHTML = `
    <!-- ── HEADING ── -->
    <div class="loc-heading">
      <div class="loc-heading-badge ${isStart ? 'start' : ''}">
        ${isStart ? 'Starting point' : `Checkpoint ${loc.orderId}`}
      </div>
      <h2>${escapeHtml(loc.name)}</h2>
      <p class="loc-heading-addr">
        <i class="fa-solid fa-location-dot" style="color:#4b3a8e;font-size:11px;"></i>
        ${escapeHtml(loc.address || '—')}
      </p>
    </div>

    <!-- ── DIRECTIONS ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        Directions
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-hint">
        Add multimedia that will help players reach the ${isStart ? 'Starting point' : 'checkpoint'} faster.
        For instance, a picture of the place, a video of how to get there, etc. Be creative!
      </p>
      <textarea id="dirField" class="loc-textarea" maxlength="350"
        placeholder="Write directions to reach this location…">${escapeHtml(detail.direction || '')}</textarea>
      <div class="loc-char-count"><span id="dirCount">${(detail.direction||'').length}</span> / 350</div>
      <p class="loc-upload-label">
        Add multimedia to your directions in this chapter. Allowed formats: jpg, png, mp3, mp4
      </p>
      <div class="loc-dropzone">
        Drag and drop your files here or<br>
        <button class="loc-choose-btn" type="button">choose files</button>
      </div>
    </div>

    ${!isT3 ? `
    <!-- ── CHALLENGE ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        ${chalLabel}
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-hint">${chalHint}
        Make use of the <a href="#">Challenge Templates</a> and/or apply different formatting to the challenge question and challenge answer.
      </p>
      <textarea id="chalField" class="loc-textarea" maxlength="350"
        placeholder="Write the challenge…">${escapeHtml(detail.challenge || '')}</textarea>
      <div class="loc-char-count"><span id="chalCount">${(detail.challenge||'').length}</span> / 350</div>

      <div class="loc-effects-label">Apply effects</div>
      <select class="loc-effects-select" id="effectSel">
        <option value="standard" ${(detail.effect||'standard')==='standard'?'selected':''}>Standard</option>
        <option value="mystery"  ${(detail.effect||'')==='mystery' ?'selected':''}>Mystery</option>
        <option value="comedy"   ${(detail.effect||'')==='comedy'  ?'selected':''}>Comedy</option>
        <option value="horror"   ${(detail.effect||'')==='horror'  ?'selected':''}>Horror</option>
      </select>

      <p class="loc-upload-label">
        Add multimedia for the puzzle (optional). Allowed formats: jpg, jpeg, png, mp3, mp4
      </p>
      <div class="loc-dropzone">
        Drag and drop your files here or<br>
        <button class="loc-choose-btn" type="button">choose files</button>
      </div>
      <p class="loc-upload-label">
        Background sound (will be played in the background while reading). Allowed format: mp3
      </p>
      <div class="loc-dropzone">
        Drag and drop your file here or<br>
        <button class="loc-choose-btn" type="button">choose file</button>
      </div>
      <p class="loc-upload-label">
        Text reading (upload a voice-over file). Allowed format: mp3
      </p>
      <div class="loc-dropzone">
        Drag and drop your file here or<br>
        <button class="loc-choose-btn" type="button">choose file</button>
      </div>
    </div>

    <!-- ── ANSWER ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        Answer
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-hint">Choose the type of answer for this place's puzzle</p>
      <select class="loc-answer-type" id="ansTypeSel">
        <option value="simple" ${(detail.answerType||'simple')==='simple'?'selected':''}>Simple type form</option>
        <option value="multiple" ${(detail.answerType||'')==='multiple'?'selected':''}>Multiple choice</option>
        <option value="photo" ${(detail.answerType||'')==='photo'?'selected':''}>Photo submission</option>
      </select>
      <label id="choiceOptions" for="choiceField">Multiple-choice options (one per line)
        <textarea id="choiceField" class="loc-textarea" rows="4">${escapeHtml((detail.choices || []).join('\n'))}</textarea>
      </label>
      <div class="loc-correct-answer-label">
        <i class="fa-solid fa-circle-check"></i> Correct answer
      </div>
      <input type="text" id="ansField" class="loc-input"
        placeholder="Enter the correct answer…"
        value="${escapeHtml(detail.answer || '')}">
    </div>

    <!-- ── HINT ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        Hint
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-hint">
        It's always a good idea to add a hint just in case a player needs help solving a challenge.
        Players can request an extra hint in-game at the cost of some XP points.
      </p>
      <textarea id="hintField" class="loc-textarea" maxlength="325"
        placeholder="Write a helpful hint…">${escapeHtml(detail.hint || '')}</textarea>
      <div class="loc-char-count"><span id="hintCount">${(detail.hint||'').length}</span> / 325</div>

      <p class="loc-upload-label-warn">
        <strong>Hint file</strong><br>
        Please upload photos that will be used by us to review your challenge. One of them will also be displayed in the game as a hint (received on player's request). Supported formats: jpg, png.
      </p>
      <div class="loc-dropzone">
        Drag and drop your file here or<br>
        <button class="loc-choose-btn" type="button">choose file</button>
      </div>
    </div>
    ` : ''}

    <!-- ── FACTS (non-fiction) ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        Facts (non-fiction stories)
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-warn">
        Make sure these are not copied from the Internet, rather rephrased and rewritten.
      </p>
      <p class="loc-section-note">
        Try not to add too many historical dates, rather focus on information that's WOW and memorable for players.
      </p>
      <textarea id="nonficField" class="loc-textarea" maxlength="500"
        placeholder="Write a historical or cultural fact about this place…">${escapeHtml(detail.nonfiction || '')}</textarea>
      <div class="loc-char-count"><span id="nonficCount">${(detail.nonfiction||'').length}</span> / 500</div>

      <p class="loc-upload-label">
        <strong>Fact files</strong><br>
        Add a photo or video to accompany the non-fiction stories. Allowed formats: jpg, jpeg, png, mp3, mp4
      </p>
      <div class="loc-dropzone">
        Drag and drop your files here or<br>
        <button class="loc-choose-btn" type="button">choose files</button>
      </div>

      <p class="loc-upload-label">
        Background sound (will be played on the background while reading). Allowed format: mp3
      </p>
      <div class="loc-dropzone">
        Drag and drop your file here or<br>
        <button class="loc-choose-btn" type="button">choose file</button>
      </div>

      <p class="loc-upload-label">
        Text reading (upload a voice-over file, so the players can listen to a narration of this section). Allowed format: mp3
      </p>
      <div class="loc-dropzone">
        Drag and drop your file here or<br>
        <button class="loc-choose-btn" type="button">choose file</button>
      </div>
    </div>

    <!-- ── ETC ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        ETC (Estimated time of completion)
        <a href="#" class="learn-more">Learn more</a>
      </div>
      <p class="loc-section-hint">
        Add an estimate for the amount of time a player will need to complete this checkpoint.
      </p>
      <input type="number" id="etcField" class="loc-etc-num"
        placeholder="10" min="1" max="60" value="${escapeHtml(detail.etc || '')}">
      <div class="loc-save-row">
        <button class="loc-save-btn" id="saveBtn">
          <i class="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>

    <!-- ── STICKY SAVE BAR ── -->
    <div class="loc-sticky-bar">
      <button class="loc-save-btn" id="saveBtnSticky">Save changes</button>
      <div class="loc-save-feedback" id="saveFeedback">
        <i class="fa-solid fa-circle-check"></i> Saved!
      </div>
      ${nextLoc
        ? `<a href="location.html?locId=${nextLoc.id}&storyId=${storyId}" class="loc-next-link">
             Next: ${nextLoc.name} <i class="fa-solid fa-arrow-right"></i>
           </a>`
        : `<a href="completeRoute.html?id=${storyId}" class="loc-next-link">
             Done — back to route <i class="fa-solid fa-arrow-right"></i>
           </a>`}
    </div>`;

  // ── Char counters ──────────────────────────────────────────────────────
  bindCounter('dirField',    'dirCount');
  bindCounter('nonficField', 'nonficCount');
  if (!isT3) {
    bindCounter('chalField',  'chalCount');
    bindCounter('hintField',  'hintCount');
  }

  // ── Live phone preview ─────────────────────────────────────────────────
  const liveFields = ['dirField', 'chalField', 'hintField', 'nonficField', 'ansField'];
  liveFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updatePhonePreview(collectData(isT3), type));
  });

  // ── Save handlers ──────────────────────────────────────────────────────
  const typeSelector = document.getElementById('ansTypeSel');
  const updateChoices = () => {
    const options = document.getElementById('choiceOptions');
    if (options) options.hidden = typeSelector.value !== 'multiple';
  };
  typeSelector?.addEventListener('change', updateChoices);
  updateChoices();

  const collectMedia = MediaEditor.bind('.loc-dropzone', [
    ['direction'],
    ...(isT3 ? [] : [['challenge'], ['challenge', 'background'], ['challenge', 'voiceover'], ['hint']]),
    ['nonfiction'], ['nonfiction', 'background'], ['nonfiction', 'voiceover']
  ], DB.getLocationDetails(storyId, locId)?.media);

  const doSave = async () => {
    const data = collectData(isT3);
    if (data.answerType === 'multiple' && (new Set(data.choices).size < 2 || !data.choices.includes(data.answer))) {
      alert('Add at least two distinct options and enter one of them as the correct answer.');
      return;
    }
    try {
      DB.upsertLocationDetails({ storyId, locId, orderId: loc.orderId, ...data, media: await collectMedia() });
    } catch (error) {
      alert(error.message);
      return;
    }
    showFeedback();
    // Refresh tabs
    document.getElementById('locTabs').innerHTML = '';
    buildTabs(DB.getLocationsByStory(storyId), loc, story);
  };

  document.getElementById('saveBtn').addEventListener('click', doSave);
  document.getElementById('saveBtnSticky').addEventListener('click', doSave);
}

function collectData(isT3) {
  return {
    direction:  val('dirField'),
    challenge:  isT3 ? '' : val('chalField'),
    answer:     isT3 ? '' : val('ansField'),
    answerType: isT3 ? 'simple' : val('ansTypeSel'),
    choices:    isT3 || val('ansTypeSel') !== 'multiple' ? [] : val('choiceField').split('\n').map(choice => choice.trim()).filter(Boolean),
    hint:       isT3 ? '' : val('hintField'),
    effect:     isT3 ? 'standard' : val('effectSel'),
    nonfiction: val('nonficField'),
    etc:        parseInt(val('etcField')) || 0,
  };
}

function showFeedback() {
  const fb = document.getElementById('saveFeedback');
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 2500);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function bindCounter(fieldId, countId) {
  const ta = document.getElementById(fieldId);
  const ct = document.getElementById(countId);
  if (!ta || !ct) return;
  ta.addEventListener('input', () => { ct.textContent = ta.value.length; });
}

// ── Phone preview ──────────────────────────────────────────────────────────
function updatePhonePreview(data, type) {
  const container = document.getElementById('phoneContent');
  if (!container) return;

  const dir    = data.direction  || '';
  const chal   = data.challenge  || '';
  const ans    = data.answer     || '';
  const hint   = data.hint       || '';
  const nonfic = data.nonfiction || '';

  const hasAny = dir || chal || ans || hint || nonfic;
  if (!hasAny) {
    container.innerHTML = `
      <div class="ph-placeholder">
        <i class="fa-solid fa-eye"></i>
        <p>Preview appears here as you edit</p>
      </div>`;
    return;
  }

  let html = '';

  if (dir) html += `
    <div class="ph-section">
      <div class="ph-section-label">Directions</div>
      <div class="ph-section-text">${esc(dir)}</div>
    </div>`;

  if (chal && type !== 'T3') html += `
    <div class="ph-section">
      <div class="ph-section-label">${type === 'T1' ? 'Clue' : 'Challenge'}</div>
      <div class="ph-section-text">${esc(chal)}</div>
    </div>`;

  if (ans && type !== 'T3') html += `
    <div class="ph-section">
      <div class="ph-section-label">Answer input</div>
      <div class="ph-answer-input">Type your answer</div>
      <div class="ph-check-btn">Check</div>
    </div>`;

  if (hint && type !== 'T3') html += `
    <div class="ph-hint-card">
      <div class="ph-hint-card-title">💡 Hint</div>
      <div class="ph-hint-card-text">${esc(hint)}</div>
    </div>`;

  if (nonfic) html += `
    <div class="ph-fact-card">
      <div class="ph-fact-card-title">📖 Facts</div>
      <div class="ph-fact-card-text">${esc(nonfic)}</div>
    </div>`;

  container.innerHTML = html;
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .slice(0, 120) + (s.length > 120 ? '…' : '');
}
