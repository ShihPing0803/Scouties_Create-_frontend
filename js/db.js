/**
 * db.js – Write-through localStorage + json-server
 *
 * Reads  → localStorage (fast, synchronous)
 * Writes → localStorage immediately + json-server (async)
 * Init   → MERGE json-server data into localStorage
 *           (locally-created records not yet in server are preserved)
 */
(function () {
  'use strict';

  const KEY = 'scouties_db';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || emptyDb(); }
    catch { return emptyDb(); }
  }

  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch { throw new Error('Browser storage is full or unavailable. Remove large media files and try again.'); }
  }

  function emptyDb() {
    return { users: [], types: defaultTypes(), stories: [], locations: [], locationDetails: [] };
  }

  function genId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function defaultTypes() {
    return [
      { id: 'T1', name: 'Scavenger Hunt', slug: 'scavenger-hunt',
        description: 'Hide clues across the city and challenge players to find them all.',
        includes: ['Location clues', 'Photo challenges', 'Trivia questions', 'Final treasure'] },
      { id: 'T2', name: 'Quest', slug: 'quest',
        description: 'Build a narrative-driven adventure with branching choices and rich storytelling.',
        includes: ['Story narrative', 'Challenges', 'Character dialogue', 'Multiple endings'] },
      { id: 'T3', name: 'Exploration Tour', slug: 'exploration-tour',
        description: 'Create a self-guided tour revealing hidden history, art and culture.',
        includes: ['Historical facts', 'Cultural stories', 'Photo spots', 'Local tips'] }
    ];
  }

  function idEq(a, b) { return String(a) === String(b); }

  // ── Merge arrays: server wins for existing IDs, keep local-only records ──
  function mergeArr(server, local) {
    const map = new Map();
    (local  || []).forEach(x => map.set(String(x.id), x));
    (server || []).forEach(x => map.set(String(x.id), x)); // server overwrites same ID
    return Array.from(map.values());
  }

  // ── API base: same origin by default; override here if needed ───────────
  // e.g. const API_BASE = 'http://localhost:5000';
  const API_BASE = window.SCOUTIES_CREATOR_API || 'http://localhost:5000';

  function apiFetch(path, opts) {
    const url = path.startsWith('http') ? path : API_BASE + path;
    return fetch(url, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...opts
    }).then(r => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    }).catch(() => null);
  }

  const apiGet   = p          => apiFetch(p);
  const apiPost  = (p, body)  => apiFetch(p, { method: 'POST',  body: JSON.stringify(body) });
  const apiPatch = (p, body)  => apiFetch(p, { method: 'PATCH', body: JSON.stringify(body) });
  const apiDel   = p          => apiFetch(p, { method: 'DELETE' });

  // ── Init: fetch from json-server and MERGE (not overwrite) ───────────────
  const ready = (function () {
    return Promise.all([
      apiGet('/users'),
      apiGet('/types'),
      apiGet('/stories'),
      apiGet('/locations'),
      apiGet('/locationDetails'),
    ]).then(([users, types, stories, locations, locationDetails]) => {
      const local = load();
      const serverHasUsers = Array.isArray(users) && users.length > 0;

      if (serverHasUsers) {
        // Merge: server data + any locally-created records not yet on server
        save({
          ...local,
          users:           mergeArr(users,           local.users),
          types:           Array.isArray(types) && types.length ? types : local.types,
          stories:         mergeArr(stories,         local.stories),
          locations:       mergeArr(locations,       local.locations),
          locationDetails: mergeArr(locationDetails, local.locationDetails),
        });
      }
    });
  }());

  // ── Public API ────────────────────────────────────────────────────────────
  const DB = {
    ready,
    genId,
    today,

    reset() { localStorage.removeItem(KEY); location.reload(); },

    /* ── USERS ─────────────────────────────────────────────────────────── */
    getUsers()        { return load().users; },
    getUserById(id)   { return load().users.find(u => idEq(u.id, id)) || null; },
    getUserByEmail(e) {
      return load().users.find(u =>
        (u.email || '').toLowerCase() === String(e).toLowerCase()
      ) || null;
    },

    createUser(data) {
      const db   = load();
      const user = { id: genId('U'), joinDate: today(), ...data };
      db.users.push(user);
      save(db);
      apiPost('/users', user); // async, fire-and-forget
      return user;
    },

    updateUser(id, patch) {
      const db = load();
      const i  = db.users.findIndex(u => idEq(u.id, id));
      if (i < 0) return null;
      db.users[i] = { ...db.users[i], ...patch };
      save(db);
      apiPatch(`/users/${db.users[i].id}`, patch);
      return db.users[i];
    },

    login(email, pwd) {
      const user = this.getUserByEmail(email);
      if (!user || String(user.pwd) !== String(pwd)) return null;
      return user;
    },

    /* ── TYPES ─────────────────────────────────────────────────────────── */
    getTypes() {
      const t = load().types;
      return t && t.length ? t : defaultTypes();
    },
    getTypeById(id) {
      return this.getTypes().find(t => idEq(t.id, id)) || null;
    },
    getTypeBySlug(slug) {
      return this.getTypes().find(t => t.slug === slug) || null;
    },

    /* ── STORIES ───────────────────────────────────────────────────────── */
    getStoriesByUser(userId) {
      return load().stories.filter(s => idEq(s.userId, userId));
    },

    getStoryById(id) {
      return load().stories.find(s => idEq(s.id, id)) || null;
    },

    importStory(bundle, userId) {
      const db = load();
      if (!db.users.some(user => idEq(user.id, userId))) throw new Error('Sign in before importing a story.');
      const story = {
        ...bundle.story, id:genId('S'), userId, status:'draft',
        created_at:today(), last_update:today(), statistics:{plays:0, rating:0, revenue:0}
      };
      const locations = [];
      const details = [];
      bundle.locations.forEach(({detail, ...fields}, index) => {
        const location = {...fields, id:genId('LOC'), storyId:story.id, orderId:index + 1};
        locations.push(location);
        if (detail) details.push({...detail, id:location.id + '-detail', storyId:story.id, locId:location.id, orderId:location.orderId});
      });
      db.stories.push(story);
      db.locations.push(...locations);
      db.locationDetails.push(...details);
      localStorage.setItem(KEY, JSON.stringify(db));
      return story;
    },

    async submitForReview(story, bundle) {
      const endpoint = window.SCOUTIES_REVIEW_API;
      let receiptId = null;
      if (endpoint) {
        const response = await fetch(endpoint, {
          method:'POST', credentials:'same-origin',
          headers:{'Content-Type':'application/json', 'Idempotency-Key':story.id},
          body:JSON.stringify({storyId:story.id, bundle})
        });
        if (!response.ok) throw new Error('Review submission failed. Your draft is still available.');
        const receipt = await response.json();
        if (typeof receipt.id !== 'string' || !receipt.id) throw new Error('The review service did not confirm the submission.');
        receiptId = receipt.id;
      }
      const db = load();
      const index = db.stories.findIndex(item => idEq(item.id, story.id) && idEq(item.userId, story.userId));
      if (index < 0) throw new Error('The draft is no longer available.');
      db.stories[index] = {
        ...db.stories[index], status:'review', reviewLocal:!endpoint,
        reviewReceiptId:receiptId, last_update:today()
      };
      save(db);
      return {local:!endpoint};
    },

    createStory(data) {
      const db    = load();
      const story = {
        id: genId('S'), last_update: today(), created_at: today(),
        status: 'draft', languages: ['EN'],
        statistics: { plays: 0, rating: 0, revenue: 0 },
        ...data
      };
      db.stories.push(story);
      save(db);
      apiPost('/stories', story);
      return story;
    },

    updateStory(id, patch) {
      const db = load();
      const i  = db.stories.findIndex(s => idEq(s.id, id));
      if (i < 0) return null;
      db.stories[i] = { ...db.stories[i], ...patch, last_update: today() };
      save(db);
      apiPatch(`/stories/${db.stories[i].id}`, db.stories[i]);
      return db.stories[i];
    },

    deleteStory(id) {
      const story = this.getStoryById(id);
      const db    = load();
      db.stories         = db.stories.filter(s => !idEq(s.id, id));
      db.locations       = db.locations.filter(l => !idEq(l.storyId, id));
      db.locationDetails = db.locationDetails.filter(d => !idEq(d.storyId, id));
      save(db);
      if (story) apiDel(`/stories/${story.id}`);
    },

    /* ── LOCATIONS ─────────────────────────────────────────────────────── */
    getLocationsByStory(storyId) {
      return load().locations
        .filter(l => idEq(l.storyId, storyId))
        .sort((a, b) => Number(a.orderId) - Number(b.orderId));
    },

    getLocationById(id) {
      return load().locations.find(l => idEq(l.id, id)) || null;
    },

    createLocation(data) {
      const db  = load();
      const loc = { id: genId('LOC'), ...data };
      db.locations.push(loc);
      save(db);
      apiPost('/locations', loc);
      return loc;
    },

    updateLocation(id, patch) {
      const db = load();
      const i  = db.locations.findIndex(l => idEq(l.id, id));
      if (i < 0) return null;
      db.locations[i] = { ...db.locations[i], ...patch };
      save(db);
      apiPatch(`/locations/${db.locations[i].id}`, db.locations[i]);
      return db.locations[i];
    },

    deleteLocation(id) {
      const db  = load();
      const loc = db.locations.find(l => idEq(l.id, id));
      db.locations = db.locations.filter(l => !idEq(l.id, id));
      if (loc) {
        db.locations
          .filter(l => idEq(l.storyId, loc.storyId))
          .sort((a, b) => Number(a.orderId) - Number(b.orderId))
          .forEach((l, idx) => { l.orderId = idx + 1; });
        db.locationDetails = db.locationDetails.filter(
          d => !(idEq(d.storyId, loc.storyId) && idEq(d.locId, id))
        );
        apiDel(`/locations/${loc.id}`);
      }
      save(db);
    },

    /* ── LOCATION DETAILS ──────────────────────────────────────────────── */
    getLocationDetails(storyId, locId) {
      return load().locationDetails.find(
        d => idEq(d.storyId, storyId) && idEq(d.locId, locId)
      ) || null;
    },

    upsertLocationDetails(data) {
      const db = load();
      const i  = db.locationDetails.findIndex(
        d => idEq(d.storyId, data.storyId) && idEq(d.locId, data.locId)
      );
      if (!data.id) data.id = `${data.locId}-detail`;

      if (i >= 0) {
        db.locationDetails[i] = { ...db.locationDetails[i], ...data };
        save(db);
        apiPatch(`/locationDetails/${db.locationDetails[i].id}`, db.locationDetails[i]);
      } else {
        db.locationDetails.push(data);
        save(db);
        apiPost('/locationDetails', data);
      }
    },

    /* ── STATS ─────────────────────────────────────────────────────────── */
    getUserStats(userId) {
      const stories   = this.getStoriesByUser(userId);
      const published = stories.filter(s => s.status === 'published');
      const plays     = stories.reduce((a, s) => a + (s.statistics?.plays   || 0), 0);
      const revenue   = stories.reduce((a, s) => a + (s.statistics?.revenue || 0), 0);
      const ratings   = published.map(s => s.statistics?.rating || 0).filter(r => r > 0);
      const avgRating = ratings.length
        ? (ratings.reduce((a, r) => a + r, 0) / ratings.length).toFixed(1)
        : '–';
      return { total: stories.length, published: published.length, plays, revenue, avgRating };
    },
  };

  window.DB = DB;
}());
