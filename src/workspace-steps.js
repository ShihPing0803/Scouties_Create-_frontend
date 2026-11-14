const MIN_LOCS = 10;

// ── Per-type step definitions ──────────────────────────────────────────────
export function getStepDefs(story) {
  const storyId = encodeURIComponent(story.id);
  const DB = window.DB;
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

  const locs = DB.getLocationsByStory(story.id);

  const routeDone = s => {
    if (locs.length < MIN_LOCS) return false;
    return locs.every(l => {
      const d = DB.getLocationDetails(story.id, l.id);
      if (!d) return false;
      return story.type === 'T3'
        ? !!(d.direction && d.nonfiction)
        : !!(d.direction && d.challenge);
    });
  };

  const routeTodos = [
    { text: `Add ${MIN_LOCS}–15 locations on the map`, key: () => locs.length >= MIN_LOCS },
    { text: 'Add directions for every checkpoint',     key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(story.id, l.id); return d && d.direction; }) },
    { text: 'Add challenge for every checkpoint',      key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(story.id, l.id); return d && d.challenge; }), hide: story.type === 'T3' },
    { text: 'Add non-fiction story for every stop',    key: () => locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(story.id, l.id); return d && d.nonfiction; }) },
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
        const locs = DB.getLocationsByStory(story.id);
        return locs.length > 0 && locs.every(l => {
          const d = DB.getLocationDetails(story.id, l.id);
          return d && d.intro && d.outro;
        });
      },
      todos: [
        { text: 'Write the storyline (min 300 chars)', key: s => !!(s.storyline && s.storyline.length >= 300) },
        { text: 'Add Intro fiction for every checkpoint', key: () => {
            const locs = DB.getLocationsByStory(story.id);
            return locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(story.id, l.id); return d && d.intro; });
          }
        },
        { text: 'Add Outro fiction for every checkpoint', key: () => {
            const locs = DB.getLocationsByStory(story.id);
            return locs.length > 0 && locs.every(l => { const d = DB.getLocationDetails(story.id, l.id); return d && d.outro; });
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

export function slugOf(type) {
  return { T1: 'scavenger-hunt', T2: 'quest', T3: 'exploration-tour' }[type] || 'quest';
}

