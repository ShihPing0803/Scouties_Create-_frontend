const stories = [
  {
    id: 10743,
    title: "tokyo",
    order: 1,
    type: "Scavenger Hunt",
    step: "Step 2",
    city: "Tokyo, Japan, Japan",
    last_update: "2025-11-18",
    created_at: "2025-11-18",
    game_owner: {
      name: "Shih Ping",
      email: "aa0421626@gmail.com"
    },
    editor: null,
    writer: null,
    languages: ["EN"],
    statistics: null
  },
  {
    id: 10690,
    title: "test",
    order: 2,
    type: "Quest",
    step: "Step 2",
    city: "Tokyo, Japan, Japan",
    last_update: "2025-11-09",
    created_at: "2025-11-09",
    game_owner: {
      name: "Shih Ping",
      email: "aa0421626@gmail.com"
    },
    editor: null,
    writer: null,
    languages: ["EN"],
    statistics: null
  }
];

const storyTypes = [
  {
    id: "T1",
    name: "Scavenger Hunt",
    description: "To put it simply, Scavenger Hunts don’t have Fiction or Facts as standard. This means Scavenger Hunts are our middle ground for build difficulty.The emphasis of a Scavenger Hunt should always be on fun, engaging challenges and solving puzzles to progress. In other words, this one’s for explorers with a creative streak.",
    includes: ["Challenges", "Places (5-15)"]
  },
  {
    id: "T2",
    name: "Quest",
    description:"A Quest is a city exploration game with all the trimmings, be it places, challenges, facts and fiction – Quests have it all. For this reason, Quests are the most complex type of city exploration game we offer.The most important difference between Quests and the other two game types is that Quests include a fictional narrative. If you’re a storyteller at heart, this one’s for you.",
    includes: ["Challenges", "Places (10-15)", "Fiction", "Facts", "Storyline"]
  },
  {
    id: "T3",
    name: "Exploration Tour",
    description: "Exploration Tours are the most basic form of city exploration game we offer on our platform. Because there’s much less content, however, this means your route needs to be the best thing since sliced bread! \
    The key focus of an exploration tour is to create the perfect route, with scenic views and a plethora of interesting Checkpoint places along the way. Pair this A-class route with some jaw-dropping facts and you’re good to go.\
    This one’s for tour guides, history buffs or perhaps those with a golden route up their sleeve.",
    includes: ["Places (5-15)", "Challenges"]
  }
];
const mockData = {
  stories,
  storyTypes
};

export default mockData;
