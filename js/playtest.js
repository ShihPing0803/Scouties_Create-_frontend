(function () {
  'use strict';
  const dialog = document.getElementById('playtestDialog');
  const root = document.getElementById('playtestContent');
  const normalize = value => value.normalize('NFKC').trim().toLocaleLowerCase();

  function add(tag, text, parent = root) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    parent.append(el);
    return el;
  }

  function button(label, callback, parent = root) {
    const el = add('button', label, parent);
    el.type = 'button';
    el.className = 'btn-submit';
    el.onclick = callback;
    return el;
  }

  function media(items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || !['image', 'audio', 'video'].includes(item.type)) continue;
      let url;
      try { url = new URL(item.url); } catch { continue; }
      const embedded = {
        image:/^data:image\/(jpeg|png);base64,/,
        audio:/^data:audio\/mpeg;base64,/,
        video:/^data:video\/mp4;base64,/
      };
      if (url.protocol !== 'https:' && !embedded[item.type].test(item.url)) continue;
      const el = add(item.type === 'image' ? 'img' : item.type);
      el.src = url.href;
      el.style.cssText = 'display:block;max-width:100%;margin:10px 0';
      if (item.type === 'image') el.alt = typeof item.alt === 'string' ? item.alt : '';
      else el.controls = true;
    }
  }

  function open(bundle) {
    if (!bundle.locations.length) throw new Error('Add a location before playtesting.');
    const {story, locations} = bundle;
    let index = 0;
    let xp = 0;
    const progressKey = bundle.progressKey && 'scouties-playtest-' + bundle.progressKey;
    if (progressKey) {
      try {
        const progress = JSON.parse(sessionStorage.getItem(progressKey));
        if (progress && Number.isInteger(progress.index) && progress.index >= 0 && progress.index <= locations.length) {
          index = progress.index;
          xp = Number(progress.xp) || 0;
        }
      } catch {}
    }
    function screen(label) {
      root.replaceChildren();
      add('h2', story.title);
      add('p', label + ' · ' + xp + ' XP');
    }
    function station() {
      if (index === locations.length) {
        screen('Route completed');
        if (story.ending) add('p', story.ending);
        button('Play again', () => { index = 0; xp = 0; if (progressKey) sessionStorage.removeItem(progressKey); start(); });
        return;
      }
      const {name, address, lat, lng, detail = null} = locations[index];
      const stop = detail || {};
      screen('Stop ' + (index + 1) + ' of ' + locations.length);
      add('h3', name);
      if (stop.direction) add('p', stop.direction);
      media(stop.media?.direction);
      if (address || lat !== null) {
        const map = add('a', 'Open map');
        const destination = lat !== null ? lat + ',' + lng : address;
        map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(destination);
        map.target = '_blank';
        map.rel = 'noopener';
      }
      button('Simulate arrival', () => challenge(stop));
    }
    function challenge(stop) {
      screen('Stop ' + (index + 1) + ' of ' + locations.length);
      add('h3', locations[index].name);
      if (stop.intro) add('p', stop.intro);
      if (!stop.challenge || story.type === 'T3') {
        finish(stop, 0);
        return;
      }

      media(stop.media?.intro);
      add('p', stop.challenge);
      media(stop.media?.challenge);
      let hinted = false;
      const form = add('form');
      const label = add('label', stop.answerType === 'photo' ? 'Test photo' : 'Your answer', form);
      const isPhoto = stop.answerType === 'photo';
      const choices = stop.answerType === 'multiple' ? stop.choices : null;
      const input = add(choices?.length ? 'select' : 'input', '', label);
      if (choices?.length) {
        add('option', 'Choose an answer', input).value = '';
        choices.forEach(choice => add('option', choice, input).value = choice);
      }
      if (isPhoto) {
        input.type = 'file';
        input.accept = 'image/*';
      }
      input.required = true;
      const check = add('button', isPhoto ? 'Test photo flow' : 'Check answer', form);
      check.type = 'submit';
      check.className = 'btn-submit';
      const feedback = add('p', '');
      feedback.setAttribute('role', 'status');
      form.onsubmit = event => {
        event.preventDefault();
        if (isPhoto && input.files[0]?.type.startsWith('image/')) finish(stop, 0, 'Photo selected for preview');
        else if (!isPhoto && normalize(input.value) === normalize(stop.answer || '')) finish(stop, hinted ? 5 : 10, 'Correct answer');
        else feedback.textContent = isPhoto ? 'Choose an image file.' : 'Try again.';
      };
      if (stop.hint || stop.media?.hint?.length) button('Hint (−5 XP from this stop)', () => {
        if (hinted) return;
        hinted = true;
        feedback.textContent = stop.hint || '';
        media(stop.media?.hint);
      });
      button(isPhoto ? 'Skip photo' : 'Reveal answer / skip', () =>
        finish(stop, 0, !isPhoto && stop.answer ? 'Answer: ' + stop.answer : 'Challenge skipped'));
    }

    function finish(stop, points, message) {
      xp += points;
      screen('Stop ' + (index + 1) + ' of ' + locations.length);
      if (message) add('h3', message);
      if (stop.intro && (!stop.challenge || story.type === 'T3')) add('p', stop.intro);
      if (!stop.challenge || story.type === 'T3') media(stop.media?.intro);
      if (stop.outro) add('p', stop.outro);
      media(stop.media?.outro);
      if (stop.nonfiction) add('p', stop.nonfiction);
      media(stop.media?.nonfiction);
      button(index + 1 === locations.length ? 'Finish route' : 'Next stop', () => {
        index++;
        if (progressKey) sessionStorage.setItem(progressKey, JSON.stringify({index, xp}));
        station();
      });
    }

    function start() {
      screen('Playtest');
      if (story.storyline) add('p', story.storyline);
      media(story.media?.storyline);
      button(index ? 'Resume route' : 'Start route', station);
    }
    start();
    dialog.showModal();
  }

  window.Playtest = {open};
})();
