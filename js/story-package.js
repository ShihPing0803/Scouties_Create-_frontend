(function () {
  'use strict';

  const schema = 'scouties.story/v1';
  const storyFields = ['type', 'title', 'city', 'description', 'storyline', 'difficulty', 'duration', 'ageRating', 'languages', 'coverPhoto', 'pricing', 'characters', 'ending', 'media', 'overview', 'highlights', 'goodToKnow', 'cityLat', 'cityLng'];
  const detailFields = ['direction', 'challenge', 'answer', 'answerType', 'choices', 'hint', 'effect', 'nonfiction', 'etc', 'intro', 'outro', 'media', 'character', 'gps'];
  const pick = (record, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(record, key)).map(key => [key, record[key]]));
  const text = value => typeof value === 'string' && Boolean(value.trim());
  const coordinate = (value, max) => value === null || (typeof value === 'number' && Math.abs(value) <= max);
  const object = value => value && typeof value === 'object' && !Array.isArray(value);

  function checkMedia(media) {
    if (media == null) return;
    const protocols = {
      image:/^data:image\/(jpeg|png);base64,/,
      audio:/^data:audio\/mpeg;base64,/,
      video:/^data:video\/mp4;base64,/
    };
    if (!object(media)) throw new Error('Invalid media list.');
    for (const items of Object.values(media)) {
      if (!Array.isArray(items) || items.some(item =>
        !object(item) || !Object.hasOwn(protocols, item.type) || typeof item.url !== 'string' ||
        (!/^https:\/\//i.test(item.url) && !protocols[item.type].test(item.url)))) {
        throw new Error('Media must be an HTTPS URL or a supported embedded file.');
      }
    }
  }

  function read(value) {
    if (!object(value) || value.schema !== schema || !object(value.story) || !Array.isArray(value.locations)) {
      throw new Error('Choose a Scouties story package (scouties.story/v1).');
    }
    const story = pick(value.story, storyFields);
    if (!['T1', 'T2', 'T3'].includes(story.type) || ![story.title, story.city, story.description].every(text)) {
      throw new Error('Game type, title, city and description are required.');
    }
    if (value.locations.length > 15) throw new Error('A story can have at most 15 locations.');
    for (const key of ['storyline', 'difficulty', 'ageRating', 'coverPhoto', 'ending', 'overview', 'highlights']) {
      if (story[key] != null && typeof story[key] !== 'string') throw new Error('Invalid story field: ' + key);
    }
    if (story.goodToKnow && (!Array.isArray(story.goodToKnow) || !story.goodToKnow.every(text))) throw new Error('Invalid cover information.');
    if (!coordinate(story.cityLat ?? null, 90) || !coordinate(story.cityLng ?? null, 180)) throw new Error('Invalid city coordinates.');
    if (story.duration != null && !/^\d+$/.test(String(story.duration))) throw new Error('Invalid duration.');
    if (story.languages && (!Array.isArray(story.languages) || !story.languages.every(text))) throw new Error('Invalid languages.');
    if (story.pricing && (!object(story.pricing) || !['free', 'paid'].includes(story.pricing.model) || !['public', 'unlisted'].includes(story.pricing.visibility || 'public'))) throw new Error('Invalid pricing settings.');
    checkMedia(story.media);
    const locations = value.locations.map((location, index) => {
      if (!object(location) || !text(location.name) || typeof location.address !== 'string' ||
          !coordinate(location.lat ?? null, 90) || !coordinate(location.lng ?? null, 180) ||
          ((location.lat == null) !== (location.lng == null))) {
        throw new Error('Check the name, address and coordinates for location ' + (index + 1) + '.');
      }
      if (location.detail != null && !object(location.detail)) throw new Error('Invalid content for location ' + (index + 1) + '.');
      const detail = location.detail ? pick(location.detail, detailFields) : null;
      if (detail) {
        checkMedia(detail.media);
        for (const key of ['direction', 'challenge', 'answer', 'hint', 'effect', 'nonfiction', 'intro', 'outro']) {
          if (detail[key] != null && typeof detail[key] !== 'string') throw new Error('Invalid ' + key + ' in location ' + (index + 1) + '.');
        }
        if (detail.answerType && !['simple', 'multiple', 'photo'].includes(detail.answerType)) throw new Error('Unsupported answer type in location ' + (index + 1) + '.');
        if (detail.choices && (!Array.isArray(detail.choices) || !detail.choices.every(text))) throw new Error('Invalid choices in location ' + (index + 1) + '.');
      }
      return {name:location.name, address:location.address, lat:location.lat ?? null, lng:location.lng ?? null, detail};
    });
    return {schema, story, locations};
  }

  function collect(story) {
    return {
      schema, story:pick(story, storyFields),
      locations:DB.getLocationsByStory(story.id).map(location => ({
        ...pick(location, ['name', 'address', 'lat', 'lng']),
        detail:DB.getLocationDetails(story.id, location.id)
      }))
    };
  }

  function download(story) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(read(collect(story)), null, 2)], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scouties-' + story.id + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.StoryPackage = {read, collect, download};
})();
