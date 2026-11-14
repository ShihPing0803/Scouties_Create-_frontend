// ── Mock Data ──────────────────────────────────────────────────────────────

const CREATORS = [
  { id: 1,  name: "Emily Chen",      handle: "emilyc",      avatar: "https://i.pravatar.cc/80?img=3",  city: "Taipei",        country: "Taiwan",        quests: 14, rating: 4.9, players: 3200, joinYear: 2021, bio: "Local historian and travel blogger turning Taipei's hidden alleys into unforgettable adventures." },
  { id: 2,  name: "Marco Bianchi",   handle: "marcob",      avatar: "https://i.pravatar.cc/80?img=12", city: "Rome",          country: "Italy",         quests: 11, rating: 4.8, players: 4100, joinYear: 2021, bio: "Tour guide of 15 years, now sharing ancient Rome with players across the globe." },
  { id: 3,  name: "Aisha Osei",      handle: "aishao",      avatar: "https://i.pravatar.cc/80?img=25", city: "Accra",         country: "Ghana",         quests: 7,  rating: 4.7, players: 1500, joinYear: 2022, bio: "Historian and storyteller passionate about preserving West African heritage through play." },
  { id: 4,  name: "Lucas Martin",    handle: "lucasm",      avatar: "https://i.pravatar.cc/80?img=15", city: "Paris",         country: "France",        quests: 18, rating: 4.9, players: 6800, joinYear: 2020, bio: "Parisian through and through. I craft quests that take you far beyond the Eiffel Tower." },
  { id: 5,  name: "Sophie Müller",   handle: "sophiem",     avatar: "https://i.pravatar.cc/80?img=47", city: "Berlin",        country: "Germany",       quests: 9,  rating: 4.6, players: 2200, joinYear: 2022, bio: "Urban explorer and street-art enthusiast. Every Berlin story has ten layers — I reveal them all." },
  { id: 6,  name: "James Okafor",    handle: "jameso",      avatar: "https://i.pravatar.cc/80?img=8",  city: "Lagos",         country: "Nigeria",       quests: 3,  rating: 4.5, players: 620,  joinYear: 2023, bio: "New to Scouties but passionate about Lagos street culture and music history." },
  { id: 7,  name: "Hana Nakamura",   handle: "hanan",       avatar: "https://i.pravatar.cc/80?img=44", city: "Tokyo",         country: "Japan",         quests: 22, rating: 5.0, players: 9400, joinYear: 2020, bio: "Obsessed with Tokyo's micro-neighbourhoods. Each quest reveals a city most tourists never see." },
  { id: 8,  name: "Carlos Rivera",   handle: "carlosr",     avatar: "https://i.pravatar.cc/80?img=6",  city: "Mexico City",   country: "Mexico",        quests: 6,  rating: 4.6, players: 1100, joinYear: 2022, bio: "Architect by day, quest designer by night — turning Mexico City's murals into interactive stories." },
  { id: 9,  name: "Priya Sharma",    handle: "priyas",      avatar: "https://i.pravatar.cc/80?img=49", city: "Mumbai",        country: "India",         quests: 12, rating: 4.8, players: 3800, joinYear: 2021, bio: "Food writer and city wanderer creating quests around Mumbai's markets, temples, and street life." },
  { id: 10, name: "Oliver Smith",    handle: "olivers",     avatar: "https://i.pravatar.cc/80?img=11", city: "London",        country: "United Kingdom",quests: 15, rating: 4.7, players: 5200, joinYear: 2020, bio: "Former detective, now crafting mystery-themed quests across London's most iconic streets." },
  { id: 11, name: "Yuki Tanaka",     handle: "yukit",       avatar: "https://i.pravatar.cc/80?img=32", city: "Osaka",         country: "Japan",         quests: 8,  rating: 4.8, players: 2700, joinYear: 2022, bio: "Foodie and culture nerd — my Osaka quests always end at the best takoyaki stand." },
  { id: 12, name: "Fatima Al-Said",  handle: "fatimas",     avatar: "https://i.pravatar.cc/80?img=53", city: "Dubai",         country: "UAE",           quests: 4,  rating: 4.4, players: 730,  joinYear: 2023, bio: "Exploring the contrast between old Dubai and the futuristic skyline, one stop at a time." },
  { id: 13, name: "David Park",      handle: "davidp",      avatar: "https://i.pravatar.cc/80?img=18", city: "Seoul",         country: "South Korea",   quests: 13, rating: 4.9, players: 4600, joinYear: 2021, bio: "K-culture enthusiast sharing the neighbourhoods, street food, and stories that K-dramas never show." },
  { id: 14, name: "Ana Sousa",       handle: "anas",        avatar: "https://i.pravatar.cc/80?img=56", city: "Lisbon",        country: "Portugal",      quests: 10, rating: 4.7, players: 2900, joinYear: 2021, bio: "Fado singer turned digital storyteller. My Lisbon quests sing the city's soul." },
  { id: 15, name: "Mohammed Hassan", handle: "mohammedh",   avatar: "https://i.pravatar.cc/80?img=20", city: "Cairo",         country: "Egypt",         quests: 5,  rating: 4.5, players: 980,  joinYear: 2023, bio: "Egyptologist sharing 5,000 years of Cairo history through modern interactive adventures." },
  { id: 16, name: "Sara Lindqvist",  handle: "saral",       avatar: "https://i.pravatar.cc/80?img=60", city: "Stockholm",     country: "Sweden",        quests: 2,  rating: 4.3, players: 340,  joinYear: 2024, bio: "Nature lover and design enthusiast. Just getting started — watch this space!" },
  { id: 17, name: "Raj Patel",       handle: "rajp",        avatar: "https://i.pravatar.cc/80?img=22", city: "New York City", country: "United States", quests: 19, rating: 4.8, players: 7200, joinYear: 2020, bio: "NYC born and raised. My quests go deep into the boroughs most visitors never reach." },
  { id: 18, name: "Mei Lin",         handle: "meil",        avatar: "https://i.pravatar.cc/80?img=36", city: "Shanghai",      country: "China",         quests: 11, rating: 4.7, players: 3300, joinYear: 2021, bio: "Art curator creating quests that weave through Shanghai's gallery districts and colonial heritage." },
  { id: 19, name: "Elena Popescu",   handle: "elenap",      avatar: "https://i.pravatar.cc/80?img=41", city: "Bucharest",     country: "Romania",       quests: 7,  rating: 4.6, players: 1700, joinYear: 2022, bio: "Bucharest is Europe's best-kept secret. I'm busy fixing that, one quest at a time." },
  { id: 20, name: "Tom Hughes",      handle: "tomh",        avatar: "https://i.pravatar.cc/80?img=13", city: "Sydney",        country: "Australia",     quests: 6,  rating: 4.5, players: 1400, joinYear: 2022, bio: "Surf instructor and harbour lover crafting outdoor quests around Sydney's coast and history." },
  { id: 21, name: "Ingrid Berg",     handle: "ingridb",     avatar: "https://i.pravatar.cc/80?img=58", city: "Oslo",          country: "Norway",        quests: 3,  rating: 4.4, players: 510,  joinYear: 2023, bio: "Viking history nerd. Yes, there are still Viking traces in Oslo — my quests find them." },
  { id: 22, name: "Chen Wei",        handle: "chenw",       avatar: "https://i.pravatar.cc/80?img=26", city: "Beijing",       country: "China",         quests: 16, rating: 4.9, players: 5100, joinYear: 2020, bio: "Imperial history meets modern life — my Beijing quests span dynasties and hutong culture." },
  { id: 23, name: "Amara Diallo",    handle: "amarad",      avatar: "https://i.pravatar.cc/80?img=45", city: "Nairobi",       country: "Kenya",         quests: 4,  rating: 4.6, players: 870,  joinYear: 2023, bio: "Community organiser turning Nairobi's vibrant neighbourhoods into player adventures." },
  { id: 24, name: "Lukas Novak",     handle: "lukasn",      avatar: "https://i.pravatar.cc/80?img=7",  city: "Prague",        country: "Czech Republic",quests: 8,  rating: 4.7, players: 2400, joinYear: 2022, bio: "Beer historian and old-town guide crafting atmospheric quests through medieval Prague." },
];

// ── State ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

let state = {
  level: "all",
  country: "all",
  city: "all",
  sort: "quests",
  page: 1,
  cityExpanded: false,
};

const CITY_INITIAL_LIMIT = 8;

// ── Derived helpers ────────────────────────────────────────────────────────

function getLevel(quests) {
  if (quests >= 10) return "top";
  if (quests >= 5)  return "rising";
  return "new";
}

function levelLabel(level) {
  return { top: "Top Creator", rising: "Rising Star", new: "New Creator" }[level];
}

function levelIcon(level) {
  return { top: "fa-trophy", rising: "fa-star", new: "fa-seedling" }[level];
}

function stars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<i class="fa-solid fa-star"></i>'.repeat(full) +
    (half ? '<i class="fa-solid fa-star-half-stroke"></i>' : '') +
    '<i class="fa-regular fa-star"></i>'.repeat(empty)
  );
}

// ── Filter + Sort ──────────────────────────────────────────────────────────

function filteredCreators() {
  let list = [...CREATORS];

  if (state.level !== "all") {
    list = list.filter(c => getLevel(c.quests) === state.level);
  }
  if (state.country !== "all") {
    list = list.filter(c => c.country === state.country);
  }
  if (state.city !== "all") {
    list = list.filter(c => c.city === state.city);
  }

  const sorters = {
    quests:  (a, b) => b.quests  - a.quests,
    rating:  (a, b) => b.rating  - a.rating,
    players: (a, b) => b.players - a.players,
    newest:  (a, b) => b.joinYear - a.joinYear,
    name:    (a, b) => a.name.localeCompare(b.name),
  };
  list.sort(sorters[state.sort]);

  return list;
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderGrid() {
  const grid = document.getElementById("creatorGrid");
  const all  = filteredCreators();
  const visible = all.slice(0, state.page * PAGE_SIZE);

  document.getElementById("resultCount").textContent = all.length;

  grid.innerHTML = visible.map((c, i) => {
    const level = getLevel(c.quests);
    return `
      <div class="cr-card" style="animation-delay:${(i % PAGE_SIZE) * 40}ms">
        <div class="cr-card-rank">#${i + 1}</div>
        <div class="cr-card-header">
          <img src="${c.avatar}" alt="${c.name}" class="cr-card-avatar">
          <div class="cr-card-badge cr-badge-${level}">
            <i class="fa-solid ${levelIcon(level)}"></i> ${levelLabel(level)}
          </div>
        </div>
        <div class="cr-card-body">
          <h3 class="cr-card-name">${c.name}</h3>
          <span class="cr-card-handle">@${c.handle}</span>
          <p class="cr-card-location"><i class="fa-solid fa-location-dot"></i> ${c.city}, ${c.country}</p>
          <p class="cr-card-bio">${c.bio}</p>
        </div>
        <div class="cr-card-stats">
          <div class="cr-card-stat">
            <strong>${c.quests}</strong>
            <span>Stories</span>
          </div>
          <div class="cr-card-stat">
            <div class="cr-stars">${stars(c.rating)}</div>
            <span>${c.rating.toFixed(1)}</span>
          </div>
          <div class="cr-card-stat">
            <strong>${c.players.toLocaleString()}</strong>
            <span>Players</span>
          </div>
        </div>
        <div class="cr-card-footer">
          <span class="cr-card-since">Since ${c.joinYear}</span>
          <a href="index.html" class="cr-card-link">View Profile</a>
        </div>
      </div>`;
  }).join("");

  // Load more button
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  loadMoreBtn.style.display = visible.length < all.length ? "inline-flex" : "none";
}

// ── City list ──────────────────────────────────────────────────────────────

function buildCityList() {
  // Count creators per city (unfiltered by city, but respect level+country)
  let base = [...CREATORS];
  if (state.level !== "all")   base = base.filter(c => getLevel(c.quests) === state.level);
  if (state.country !== "all") base = base.filter(c => c.country === state.country);

  const counts = {};
  base.forEach(c => { counts[c.city] = (counts[c.city] || 0) + 1; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const limit  = state.cityExpanded ? sorted.length : CITY_INITIAL_LIMIT;
  const shown  = sorted.slice(0, limit);

  const cityList = document.getElementById("cityList");
  cityList.innerHTML = shown.map(([city, count]) => `
    <button class="cr-city-btn ${state.city === city ? "active" : ""}" data-city="${city}">
      <span>${city}</span>
      <span class="cr-city-count">${count}</span>
    </button>`).join("");

  // Load more cities button
  const lmcBtn = document.getElementById("loadMoreCities");
  lmcBtn.style.display = sorted.length > CITY_INITIAL_LIMIT ? "flex" : "none";
  lmcBtn.querySelector("i").className =
    state.cityExpanded ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down";
  lmcBtn.childNodes[0].textContent =
    state.cityExpanded ? "Show fewer cities " : "Load more cities ";

  cityList.querySelectorAll(".cr-city-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.city = state.city === btn.dataset.city ? "all" : btn.dataset.city;
      state.page = 1;
      buildCityList();
      renderGrid();
    });
  });
}

// ── Country dropdown ───────────────────────────────────────────────────────

function buildCountrySelect() {
  const countries = [...new Set(CREATORS.map(c => c.country))].sort();
  const sel = document.getElementById("countryFilter");
  countries.forEach(co => {
    const opt = document.createElement("option");
    opt.value = co;
    opt.textContent = co;
    sel.appendChild(opt);
  });
}

// ── Event wiring ───────────────────────────────────────────────────────────

function init() {
  buildCountrySelect();
  buildCityList();
  renderGrid();

  // Level buttons
  document.querySelectorAll(".cr-level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cr-level-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.level = btn.dataset.level;
      state.city  = "all";
      state.page  = 1;
      buildCityList();
      renderGrid();
    });
  });

  // Country filter
  document.getElementById("countryFilter").addEventListener("change", e => {
    state.country = e.target.value;
    state.city    = "all";
    state.page    = 1;
    buildCityList();
    renderGrid();
  });

  // Sort
  document.getElementById("sortSelect").addEventListener("change", e => {
    state.sort = e.target.value;
    state.page = 1;
    renderGrid();
  });

  // Load more creators
  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    state.page++;
    renderGrid();
  });

  // Load more cities
  document.getElementById("loadMoreCities").addEventListener("click", () => {
    state.cityExpanded = !state.cityExpanded;
    buildCityList();
  });
}

document.addEventListener("DOMContentLoaded", init);
