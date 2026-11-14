const userId  = sessionStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const storyId = new URLSearchParams(window.location.search).get('id');
if (!storyId) window.location.href = 'dashboard.html';

const MIN_LOCS = 10;

// ── Per-type step definitions ──────────────────────────────────────────────
function getStepDefs(story) {
  const editUrl = `create/${slugOf(story.type)}.html?edit=${storyId}`;

  const shared = {
    beta: {
      title: 'Beta release',
      desc:  'Your game will be published in the Beta section of the app. Invite others to try it out and ensure your game is in tip-top shape before being sold.',
      illo:  '🚀',
      link:  `review.html?id=${storyId}`,
      done:  s => ['review','published'].includes(s.status),
      todos: [
        { text: 'Submit for review',           key: s => ['review','published'].includes(s.status) },
        { text: 'Share beta link with friends', key: s => ['review','published'].includes(s.status) },
        { text: 'Collect player feedback',      key: () => false },
      ],
    },
    publishing: {
      title: 'Publishing for Sale',
      desc:  'Have your game published for sale in the app and on the website. The more you promote your game, the more passive income you\'ll earn!',
      illo:  '💰',
      link:  `pricing.html?id=${storyId}`,
      done:  s => s.status === 'published',
      todos: [
        { text: 'Complete pricing settings',   key: s => !!s.pricing },
        { text: 'Submit for review',           key: s => s.status !== 'draft' },
        { text: 'Game approved & published',   key: s => s.status === 'published' },
      ],
    },
  };

  const locs = DB.getLocationsByStory(storyId);

  const routeDone = s => {
    if (locs.length < MIN_LOCS) return false;
    return locs.every(l => {
      const d = DB.getLocationDetails(storyId, l.id);
      if (!d) return false;
      return story.type === 'T3'
        ? !!(d.direction && d.nonfiction)
        : !!(d.direction && d.challenge);
    });
  };

  const routeTodos = [
    { text: `Add ${MIN_LOCS}–15 locations on the map`, key: () => locs.length >= MIN_LOCS },
    { text: 'Add directions for every checkpoint',     key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(storyId, l.id); return d && d.direction; }) },
    { text: 'Add challenge for every checkpoint',      key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(storyId, l.id); return d && d.challenge; }), hide: story.type === 'T3' },
    { text: 'Add non-fiction story for every stop',    key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(storyId, l.id); return d && d.nonfiction; }) },
    { text: 'Cover photos saved',                      key: s => !!s.coverPhoto },
  ];

  if (story.type === 'T1') {
    return [
      {
        title: 'Game details',
        desc:  'Add the first details of your game.',
        illo:  '💡',
        link:  editUrl,
        done:  s => !!(s.title && s.city && s.description),
        todos: [
          { text: 'Set game title',                   key: s => !!s.title },
          { text: 'Select a city',                    key: s => !!s.city },
          { text: 'Write description (min 25 chars)', key: s => s.description && s.description.length >= 25 },
          { text: 'Set difficulty level',             key: s => !!s.difficulty },
        ],
      },
      {
        title: 'Route and clues',
        desc:  `Select ${MIN_LOCS}–15 locations and add clue questions, answers and hints for every checkpoint.`,
        illo:  '🗺️',
        link:  `completeRoute.html?id=${storyId}`,
        done:  routeDone,
        todos: routeTodos.filter(t => !t.hide),
      },
      {
        title: 'Treasure reveal',
        desc:  'Write the final reveal players will see when they complete the entire hunt.',
        illo:  '🏆',
        link:  `fiction.html?id=${storyId}`,
        done:  s => !!(s.fiction && s.fiction.length > 10),
        todos: [
          { text: 'Write the treasure reveal text', key: s => !!(s.fiction && s.fiction.length > 10) },
          { text: 'Add a final congratulations message', key: s => !!s.outroText },
        ],
      },
      {
      title: 'Final touches',
      desc:  'Add a few details that will help sell your game to potential players.',
      illo:  '✨',
      link:  `cover.html?id=${storyId}`,
      done:  s => !!(s.overview && s.overview.length >= 30 && s.highlights && s.highlights.length >= 100 && s.coverPhoto),
      todos: [
        { text: 'Write an Overview (min 30 chars)',     key: s => !!(s.overview   && s.overview.length   >= 30) },
        { text: 'Write Highlights (min 100 chars)',     key: s => !!(s.highlights && s.highlights.length >= 100) },
        { text: 'Select Good to know tags',             key: s => !!(s.goodToKnow && s.goodToKnow.length > 0) },
        { text: 'Set a main cover photo',               key: s => !!s.coverPhoto },
      ],
    },
      shared.beta,
      shared.publishing,
    ];
  }

  if (story.type === 'T3') {
    return [
      {
        title: 'Game details',
        desc:  'Add the first details of your tour.',
        illo:  '💡',
        link:  editUrl,
        done:  s => !!(s.title && s.city && s.description),
        todos: [
          { text: 'Set tour title',                   key: s => !!s.title },
          { text: 'Select a city',                    key: s => !!s.city },
          { text: 'Write description (min 25 chars)', key: s => s.description && s.description.length >= 25 },
        ],
      },
      {
        title: 'Directions and stories',
        desc:  `Select ${MIN_LOCS}–15 locations and write historical and cultural stories for every stop.`,
        illo:  '🗺️',
        link:  `completeRoute.html?id=${storyId}`,
        done:  routeDone,
        todos: routeTodos.filter(t => !t.hide),
      },
      {
        title: 'Audio narration',
        desc:  'Add audio narration to bring your tour to life.',
        illo:  '🎙️',
        link:  `fiction.html?id=${storyId}`,
        done:  s => !!(s.fiction && s.fiction.length > 10),
        todos: [
          { text: 'Write the welcome narration',   key: s => !!(s.fiction && s.fiction.length > 10) },
          { text: 'Write the closing narration',   key: s => !!s.outroText },
        ],
      },
      {
      title: 'Final touches',
      desc:  'Add a few details that will help sell your game to potential players.',
      illo:  '✨',
      link:  `cover.html?id=${storyId}`,
      done:  s => !!(s.overview && s.overview.length >= 30 && s.highlights && s.highlights.length >= 100 && s.coverPhoto),
      todos: [
        { text: 'Write an Overview (min 30 chars)',     key: s => !!(s.overview   && s.overview.length   >= 30) },
        { text: 'Write Highlights (min 100 chars)',     key: s => !!(s.highlights && s.highlights.length >= 100) },
        { text: 'Select Good to know tags',             key: s => !!(s.goodToKnow && s.goodToKnow.length > 0) },
        { text: 'Set a main cover photo',               key: s => !!s.coverPhoto },
      ],
    },
      shared.beta,
      shared.publishing,
    ];
  }

  // Default: T2 Quest
  return [
    {
      title: 'Game details',
      desc:  'Add the first details of your game.',
      illo:  '💡',
      link:  editUrl,
      done:  s => !!(s.title && s.city && s.description),
      todos: [
        { text: 'Set game title',                   key: s => !!s.title },
        { text: 'Select a city',                    key: s => !!s.city },
        { text: 'Write description (min 25 chars)', key: s => s.description && s.description.length >= 25 },
        { text: 'Set difficulty level',             key: s => !!s.difficulty },
      ],
    },
    {
      title: 'Directions, challenges and non-fiction',
      desc:  'Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.',
      illo:  '🗺️',
      link:  `completeRoute.html?id=${storyId}`,
      done:  routeDone,
      todos: routeTodos,
    },
    {
      title: 'Fiction',
      desc:  'Add fiction to your game and build the narrative.',
      illo:  '📖',
      link:  `fiction.html?id=${storyId}`,
      done:  s => {
        if (!(s.storyline && s.storyline.length >= 300)) return false;
        const locs = DB.getLocationsByStory(storyId);
        return locs.length > 0 && locs.every(l => {
          const d = DB.getLocationDetails(storyId, l.id);
          return d && d.intro && d.outro;
        });
      },
      todos: [
        { text: 'Write the storyline (min 300 chars)', key: s => !!(s.storyline && s.storyline.length >= 300) },
        { text: 'Add Intro fiction for every checkpoint', key: () => {
            const locs = DB.getLocationsByStory(storyId);
            return locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(storyId, l.id); return d && d.intro; });
          }
        },
        { text: 'Add Outro fiction for every checkpoint', key: () => {
            const locs = DB.getLocationsByStory(storyId);
            return locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(storyId, l.id); return d && d.outro; });
          }
        },
      ],
    },
    {
      title: 'Final touches',
      desc:  'Add a few details that will help sell your game to potential players.',
      illo:  '✨',
      link:  `cover.html?id=${storyId}`,
      done:  s => !!(s.overview && s.overview.length >= 30 && s.highlights && s.highlights.length >= 100 && s.coverPhoto),
      todos: [
        { text: 'Write an Overview (min 30 chars)',     key: s => !!(s.overview   && s.overview.length   >= 30) },
        { text: 'Write Highlights (min 100 chars)',     key: s => !!(s.highlights && s.highlights.length >= 100) },
        { text: 'Select Good to know tags',             key: s => !!(s.goodToKnow && s.goodToKnow.length > 0) },
        { text: 'Set a main cover photo',               key: s => !!s.coverPhoto },
      ],
    },
    shared.beta,
    shared.publishing,
  ];
}

function slugOf(type) {
  return { T1: 'scavenger-hunt', T2: 'quest', T3: 'exploration-tour' }[type] || 'quest';
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Show loading state
  const container = document.getElementById('stepsContainer');
  if (container) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#6b7280;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:#4b3a8e;"></i>
        <p style="margin-top:16px;font-size:14px;">Loading workspace…</p>
      </div>`;
  }

  // ← DB.ready is now inside DOMContentLoaded so spinner always shows FIRST,
  //   and renderGrid always runs AFTER, preventing the race condition.
  DB.ready.then(() => {
    let story = DB.getStoryById(storyId);

    if (!story) {
      // Retry once after 600ms (handles race with async createStory POST)
      setTimeout(() => {
        story = DB.getStoryById(storyId);
        if (!story) { showNotFound(); return; }
        finishInit(story);
      }, 600);
      return;
    }

    finishInit(story);
  });
});

function finishInit(story) {
  try {
    // Edit quest link
    const el = document.getElementById('editQuestLink');
    if (el) el.href = `create/${slugOf(story.type)}.html?edit=${storyId}`;

    renderGrid(story);
  } catch (err) {
    console.error('[Workspace] renderGrid error:', err);
    document.getElementById('stepsContainer').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <p style="font-size:15px;font-weight:700;color:#ef4444;margin-bottom:8px;">
          Something went wrong loading the workspace.
        </p>
        <p style="font-size:13px;color:#6b7280;margin-bottom:20px;">${err.message}</p>
        <a href="dashboard.html" style="color:#4b3a8e;font-weight:700;">← Back to Dashboard</a>
      </div>`;
  }
}

function showNotFound() {
  const container = document.getElementById('stepsContainer');
  if (container) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <p style="font-size:15px;font-weight:700;color:#ef4444;margin-bottom:8px;">
          Story not found (ID: <code>${storyId}</code>)
        </p>
        <p style="font-size:13px;color:#6b7280;margin-bottom:20px;">
          This story may have been deleted, or there was a sync issue. Try returning to the dashboard.
        </p>
        <a href="dashboard.html" style="color:#4b3a8e;font-weight:700;">← Back to Dashboard</a>
      </div>`;
  }
}

function renderGrid(story) {
  const defs = getStepDefs(story);
  const container = document.getElementById('stepsContainer');
  container.innerHTML = '';

  // Compute step statuses sequentially (each step requires previous to be done)
  const statuses = [];
  for (let i = 0; i < defs.length; i++) {
    if (i === 0) {
      statuses.push(defs[0].done(story) ? 'completed' : 'in-progress');
    } else {
      const prevDone = statuses[i - 1] === 'completed';
      statuses.push(
        defs[i].done(story) ? 'completed'
        : prevDone          ? 'in-progress'
        : 'locked'
      );
    }
  }

  defs.forEach((def, i) => {
    container.appendChild(buildCard(def, i + 1, statuses[i], story));
  });
}

function buildCard(def, num, status, story) {
  const div = document.createElement('div');
  div.className = `ws-card ${status}`;

  // Evaluate todos
  const todos = (def.todos || []).map(t => ({
    text: t.text,
    done: t.key(story),
  }));

  const todosHtml = todos.map(t => `
    <li>
      <i class="fa-solid ${t.done ? 'fa-circle-check done' : 'fa-circle empty'}"></i>
      <span>${t.text}</span>
    </li>`).join('');

  const footerHtml = status === 'completed'
    ? `<div class="ws-completed-footer">
        <i class="fa-solid fa-circle-check"></i>
        Yay! You have successfully completed this step!
       </div>`
    : `<button class="ws-todo-toggle" aria-expanded="false" data-card="${num}">
         To-do list <i class="fa-solid fa-chevron-down"></i>
       </button>
       <a href="${def.link}" class="ws-start-btn ${status === 'locked' ? 'disabled' : ''}">Start</a>`;

  div.innerHTML = `
    <div class="ws-card-header">
      <span class="ws-card-step-label">Step ${num}</span>
      ${status !== 'locked'
        ? `<a href="${def.link}" class="ws-card-edit-link"><i class="fa-solid fa-pen"></i> Edit step</a>`
        : ''}
    </div>
    <div class="ws-card-illo">${def.illo}</div>
    <div class="ws-card-body">
      <h3 class="ws-card-title">${def.title}</h3>
      <p class="ws-card-desc">${def.desc}</p>
    </div>
    <div class="ws-todo-wrap">
      <ul class="ws-todo-list" id="todo-${num}">${todosHtml}</ul>
    </div>
    <div class="ws-card-footer">${footerHtml}</div>`;

  // Toggle to-do list
  const toggle = div.querySelector('.ws-todo-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const list = div.querySelector('.ws-todo-list');
      const open = list.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.querySelector('i').style.transform = open ? 'rotate(180deg)' : '';
    });
  }

  return div;
}
