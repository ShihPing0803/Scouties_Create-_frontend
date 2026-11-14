if (!sessionStorage.getItem('userId')) window.location.href = 'index.html';

const storyId = new URLSearchParams(window.location.search).get('id');
if (!storyId) window.location.href = 'dashboard.html';

let currentModel = 'free';

DB.ready.then(init);

function init() {
  document.getElementById('backLink').href     = `workspace.html?id=${storyId}`;
  document.getElementById('nextStepLink').href = `review.html?id=${storyId}`;

  const story = DB.getStoryById(storyId);
  if (!story) { window.location.href = 'dashboard.html'; return; }

  // Restore saved settings
  if (story.pricing) {
    currentModel = story.pricing.model || 'free';
    if (story.pricing.price) document.getElementById('priceInput').value = story.pricing.price;
    const visibility = [...document.querySelectorAll('input[name="visibility"]')].find(input => input.value === story.pricing.visibility);
    if (visibility) {
      visibility.checked = true;
    }
  }

  applyModel(currentModel);

  // Pricing toggle
  document.querySelectorAll('.pricing-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      currentModel = btn.dataset.model;
      applyModel(currentModel);
    });
  });

  // Price presets
  document.querySelectorAll('.price-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-preset').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('priceInput').value = btn.dataset.val;
      updateRevenueCalc();
    });
  });

  // Price input live update
  document.getElementById('priceInput').addEventListener('input', () => {
    document.querySelectorAll('.price-preset').forEach(b => b.classList.remove('selected'));
    updateRevenueCalc();
  });

  // Save
  document.getElementById('saveBtn').addEventListener('click', () => {
    const price      = parseFloat(document.getElementById('priceInput').value) || 0;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    DB.updateStory(storyId, {
      pricing: { model: currentModel, price: currentModel === 'paid' ? price : 0, visibility }
    });
    showSuccess();
  });
}

function applyModel(model) {
  document.querySelectorAll('.pricing-opt').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-model="${model}"]`).classList.add('active');

  const wrap    = document.getElementById('priceInputWrap');
  const calcEl  = document.getElementById('revenueCalc');

  if (model === 'paid') {
    wrap.style.display   = 'block';
    calcEl.style.display = 'block';
    updateRevenueCalc();
  } else {
    wrap.style.display   = 'none';
    calcEl.style.display = 'none';
  }
}

function updateRevenueCalc() {
  const price = parseFloat(document.getElementById('priceInput').value) || 0;
  const earn  = (price * 0.70 * 100).toFixed(2);
  document.getElementById('revAmount').textContent = `€${earn}`;
}

function showSuccess() {
  const el = document.getElementById('saveSuccess');
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}
