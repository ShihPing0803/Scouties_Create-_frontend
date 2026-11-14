if (!sessionStorage.getItem('userId')) window.location.href = 'index.html';

const storyId = new URLSearchParams(window.location.search).get('id');
if (!storyId) window.location.href = 'dashboard.html';

const TYPE_EMOJI = { T1: '🔍 Scavenger Hunt', T2: '⚔️ Quest', T3: '🗺️ Exploration Tour' };

DB.ready.then(init);

function init() {
  document.getElementById('backLink').href = `workspace.html?id=${storyId}`;

  const story = DB.getStoryById(storyId);
  if (!story) { window.location.href = 'dashboard.html'; return; }

  if (String(story.userId) !== sessionStorage.getItem('userId')) { window.location.href = 'dashboard.html'; return; }
  const status = document.getElementById('packageStatus');
  document.getElementById('previewStoryBtn').onclick = () => {
    status.textContent = '';
    try { Playtest.open({...StoryPackage.read(StoryPackage.collect(story)), progressKey:story.id}); }
    catch (error) { status.textContent = error.message; }
  };
  document.getElementById('exportStoryBtn').onclick = () => {
    status.textContent = '';
    try { StoryPackage.download(story); }
    catch (error) { status.textContent = error.message; }
  };
  renderSummary(story);
  const allPassed = renderChecklist(story);
  renderSubmitSection(story, allPassed);
  if (story.status === 'review' && story.reviewLocal) status.textContent = 'Review package saved on this browser.';
}

function renderSummary(story) {
  const coverEl = document.getElementById('summaryCover');
  if (story.coverPhoto) {
    coverEl.style.backgroundImage = `url(${story.coverPhoto})`;
  }

  document.getElementById('summaryType').textContent  = TYPE_EMOJI[story.type] || 'Story';
  document.getElementById('summaryTitle').textContent = story.title;
  document.getElementById('summaryCity').innerHTML    =
    `<i class="fa-solid fa-location-dot" style="color:#4b3a8e;font-size:11px;"></i> ${escapeHtml(story.city)}`;
  document.getElementById('summaryDesc').textContent  = story.description;

  const tags = document.getElementById('summaryTags');
  const items = [
    story.difficulty && `${story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)}`,
    story.duration   && `${story.duration} min`,
    story.ageRating  && story.ageRating,
    story.pricing?.model === 'paid' && story.pricing.price ? `€${story.pricing.price}` : 'Free',
  ].filter(Boolean);
  tags.innerHTML = items.map(t => `<span class="summary-tag">${escapeHtml(t)}</span>`).join('');
}

function renderChecklist(story) {
  const locs    = DB.getLocationsByStory(storyId);
  const details = locs.map(location => DB.getLocationDetails(storyId, location.id)).filter(detail => {
    if (!detail?.direction?.trim()) return false;
    if (story.type === 'T3') return Boolean(detail.nonfiction?.trim());
    if (!detail.challenge?.trim()) return false;
    if (detail.answerType === 'photo') return true;
    if (!detail.answer?.trim()) return false;
    return detail.answerType !== 'multiple' || (new Set(detail.choices || []).size >= 2 && detail.choices.includes(detail.answer));
  });

  const MIN_LOCATIONS = 5;

  const checks = [
    {
      label: 'Game Details',
      desc:  'Title, city, and description filled in',
      pass:  !!(story.title && story.city && story.description),
      fix:   `create/${['','scavenger-hunt','quest','exploration-tour'][['','T1','T2','T3'].indexOf(story.type)] || 'quest'}.html?edit=${storyId}`,
    },
    {
      label: `Game Route (min ${MIN_LOCATIONS} locations)`,
      desc:  `${locs.length} location${locs.length !== 1 ? 's' : ''} added — need at least ${MIN_LOCATIONS}`,
      pass:  locs.length >= MIN_LOCATIONS,
      fix:   `completeRoute.html?id=${storyId}`,
    },
    {
      label: 'Location Content',
      desc:  `${details.length} of ${locs.length} locations have complete game content`,
      pass:  locs.length >= MIN_LOCATIONS && details.length === locs.length,
      fix:   locs.length ? `location.html?locId=${locs[0].id}&storyId=${storyId}` : `completeRoute.html?id=${storyId}`,
    },
    {
      label: 'Cover Photo',
      desc:  story.coverPhoto ? 'Cover image is set' : 'No cover photo selected',
      pass:  !!story.coverPhoto,
      fix:   `cover.html?id=${storyId}`,
    },
    {
      label: 'Pricing &amp; Settings',
      desc:  story.pricing ? `${story.pricing.model === 'paid' ? `€${story.pricing.price}` : 'Free'} · ${story.pricing.visibility || 'public'}` : 'Not configured',
      pass:  !!story.pricing,
      fix:   `pricing.html?id=${storyId}`,
    },
  ];

  const list    = document.getElementById('checklist');
  let allPassed = true;

  list.innerHTML = checks.map(c => {
    if (!c.pass) allPassed = false;
    const iconClass = c.pass ? 'done' : 'missing';
    const iconHtml  = c.pass
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-xmark"></i>';
    const fixLink = !c.pass
      ? `<a href="${c.fix}" class="check-fix-link">Fix →</a>`
      : '';
    return `
      <li class="checklist-item">
        <div class="check-icon ${iconClass}">${iconHtml}</div>
        <div class="check-label">
          <strong>${c.label}</strong>
          <span>${escapeHtml(c.desc)}</span>
        </div>
        ${fixLink}
      </li>`;
  }).join('');

  return allPassed;
}

function renderSubmitSection(story, allPassed) {
  document.getElementById('submitNotReady').style.display  = 'none';
  document.getElementById('submitReady').style.display     = 'none';
  document.getElementById('submitAlready').style.display   = 'none';
  document.getElementById('submitPublished').style.display = 'none';
  document.getElementById('submitActions').style.display   = 'none';

  if (story.status === 'published') {
    document.getElementById('submitPublished').style.display = 'flex';
  } else if (story.status === 'review') {
    document.getElementById('submitAlready').style.display = 'flex';
  } else if (allPassed) {
    document.getElementById('submitReady').style.display   = 'flex';
    document.getElementById('submitActions').style.display = 'flex';
    const submit = document.getElementById('submitBtn');
    submit.textContent = window.SCOUTIES_REVIEW_API ? 'Submit for Review' : 'Save Review Package';
    submit.onclick = submitStory;
  } else {
    document.getElementById('submitNotReady').style.display = 'flex';
  }
}

async function submitStory() {
  const button = document.getElementById('submitBtn');
  const status = document.getElementById('packageStatus');
  const story = DB.getStoryById(storyId);
  if (!story || String(story.userId) !== sessionStorage.getItem('userId') || story.status !== 'draft') return;
  if (!renderChecklist(story)) return;

  button.disabled = true;
  status.textContent = 'Submitting…';
  try {
    const bundle = StoryPackage.read(StoryPackage.collect(story));
    const result = await DB.submitForReview(story, bundle);
    renderSubmitSection(DB.getStoryById(storyId), true);
    status.textContent = result.local
      ? 'Review package saved on this browser. Export it to share with a reviewer.'
      : 'Story submitted for review.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}
