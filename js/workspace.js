const storyId = new URLSearchParams(window.location.search).get('id');

const steps = [
    {
        id: "step1",
        title: "Game details",
        description: "Add the first details of your game.",
        status: "completed",
        tips: "loremmmmmmmmmmmmmmmmmm"
    },
    {
        id: "step2",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "in-progress",
        tips: "loremmmmmmmmmmmmmmmmmm"
    },
    {
        id: "step3",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked",
        tips: "loremmmmmmmmmmmmmmmmmm"
    },
    {
        id: "step4",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked",
        tips: "loremmmmmmmmmmmmmmmmmm"
    },
    {
        id: "step5",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked",
        tips: "loremmmmmmmmmmmmmmmmmm"
    },
    {
        id: "step6",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked",
        tips: "loremmmmmmmmmmmmmmmmmm"
    }
];

const statusUI = [
    {
        status: "completed",
        showButton: false,
        disableButton: false,
        footer: "You have completed this step."
    },
    {
        status: "locked",
        showButton: true,
        disableButton: true,
        footer: null
    },
    {
        status: "in-progress",
        showButton: true,
        disableButton: false,
        footer: null

    }
];

const stepsContainer = document.querySelector(".stepsContainer");
if (stepsContainer) {
    steps.forEach(step => {
    const stepElement = document.createElement("li");
    stepElement.classList.add("step");

    const ui = statusUI.find(s => s.status === step.status);
    const isDisabled = ui.disableButton;
    const showBtn = ui.showButton;

    stepElement.innerHTML = `
        <span class="stepNumber p-3 fs-6 rounded-1 text-white bg-primary d-block" style="min-width:56px;">
            ${step.id}
        </span>
        <h3 class="p-3 mt-3 fs-4 fw-bold">${step.title}</h3>
        <img src="https://placehold.net/default.png" alt="Profile Picture" class="w-50 m-3 d-block mx-auto">
        <p class="mt-3 p-3">${step.description}</p>
        <div class="d-flex justify-content-end align-items-center gap-3 px-3 pb-3">
            <span href="#" class="fw-semibold text-decoration-none ${showBtn ? "" : "d-none"}">
                To-do list
            </span>

            <button
            class="stepButton btn stepStartBtn fw-semibold px-5 py-2 rounded-3 ${isDisabled ? "is-disabled" : ""}"
            ${isDisabled ? "disabled" : ""}>
                <a href="/completeRoute?id=${storyId}">${showBtn ? "Start" : ""}</a>
            </button>
        </div>

        ${ui.footer ? `
            <div class="alert alert-success d-flex align-items-center mx-3 mb-3 py-3 rounded-3" role="alert">
                <span class="me-2">✅</span>
                <div class="stepFooter small fw-semibold mb-0">${ui.footer}</div>
            </div>
        ` : ""}
        `;

    stepsContainer.appendChild(stepElement);
    });
};

const routeForm = document.querySelector('.route-form');
if (routeForm) {
  routeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const existing = await fetch(
      `http://localhost:3000/locations?storyId=${encodeURIComponent(storyId)}`
    ).then(r => r.json());

    const nextOrderId = existing.length
      ? Math.max(...existing.map(x => x.orderId || 0)) + 1
      : 1;


    // Collect form data
    const formData = new FormData(routeForm);
    const data = Object.fromEntries(formData);
    
    const newLocation = {
      "id": `LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`, //FIXME: Replace with real zip code
      "name": data.locName,
      "address": data.locAddress,
      "storyId": storyId,
      "orderId": nextOrderId   
    };
    
    try {
      // Send data to backend API
      const response = await fetch('http://localhost:3000/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocation)
      });
      console.log('Response:', response);
      if (response.ok) {
        routeForm.reset();
      } else {
        alert('Failed to add location');
        console.error('Failed to add location:', response.statusText);
      }
    } catch (error) {
      alert('Failed to add location');
      console.error('Error adding location:', error);
    }
  });
}

const locationList = document.querySelector('#locationList');
const locationBadge = document.querySelector('.savedNum');

if (locationList) {
  fetch("http://localhost:3000/locations")
    .then(response => response.json())
    .then(locations => {
      const s1 = locations.filter(loc => loc.storyId === storyId);

      s1.sort((a, b) => a.orderId - b.orderId);

      s1.forEach(loc => {
        fetch(`http://localhost:3000/locations/${loc.id}`)
          .then(r => r.json())
          .then(locationData => {
            const li = document.createElement("li");
            li.className = "list-group-item";

            const badges = document.createElement("div");

            const orderBadge = document.createElement("span");
            orderBadge.className = "badge bg-primary p-1";
            orderBadge.textContent = `Location #${loc.orderId}`;
            badges.appendChild(orderBadge);

            if (loc.orderId === 1) {
              const startBadge = document.createElement("span");
              startBadge.className = "badge bg-success p-1 ms-2";
              startBadge.textContent = "Starting Point";
              badges.appendChild(startBadge);
            }

            const h3 = document.createElement("h3");
            h3.className = "fw-semibold fs-5 mt-3";
            h3.textContent = locationData.name;

            const p = document.createElement("p");
            p.className = "mt-2";
            p.textContent = locationData.address;

            const btn = document.createElement("a");
            btn.className = "btn btn-outline-secondary float-end editBtn";
            btn.textContent = "Edit Details";

            //FIXME: Link is uncorrect
            btn.href = `/location?locId=${loc.locId}&storyId=${loc.storyId}&orderId=${loc.orderId}`;  
        
            li.appendChild(badges);
            li.appendChild(h3);
            li.appendChild(p);
            li.appendChild(btn);

            locationList.appendChild(li);

            locationBadge.textContent =
              `${locationList.children.length} of min. 10 locations saved`;
          });
      });
    });
}

var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.marker([51.5, -0.09]).addTo(map)
    .bindPopup('A pretty CSS popup.<br> Easily customizable.')
    .openPopup();

const addrInput = document.getElementById("locAddress");

let marker = L.marker([51.505, -0.09]).addTo(map);

let lastReverseAt = 0; // 簡單節流：避免連點
map.on("click", async (e) => {
  const now = Date.now();
  if (now - lastReverseAt < 1100) return; // ~1s 節流，符合公共 Nominatim 使用政策精神
  lastReverseAt = now;

  const { lat, lng } = e.latlng;

  marker.setLatLng([lat, lng]);
  map.panTo([lat, lng]);

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    `&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      // 公共 Nominatim 要求可識別的 UA/Referer（前端通常靠瀏覽器 Referer；UA 可能受限）
      "Accept": "application/json"
    }
  });

  if (!res.ok) return;

  const data = await res.json();
  addrInput.value = data.display_name || ""; // 最直觀的一行地址
});