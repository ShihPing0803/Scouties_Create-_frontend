async function init() {
  const [stories, storyTypes] = await Promise.all([
    fetch(`http://localhost:3000/stories?userId=${sessionStorage.getItem('userId')}`).then(res => res.json()),
    fetch("http://localhost:3000/types").then(res => res.json())
  ]);

  renderStories(stories);
  renderStoryTypes(storyTypes);
}

init();

function renderStories(stories) {
  const storiesList = document.querySelector('.stories');

  storiesList.innerHTML = stories.map(story =>
    `<li class="story-card">
        <div class="basic-info">
            <p><span>#${story.id}</span>${story.title}</p>
            <p><span>City</span>${story.city}</p>
            <time><span>Last updated</span> ${story.last_update}</time>
           
            <p><span>Editor</span>${story.editor ?? 'No assigned yet'}</p>
        </div>
        <a href="javascript:void(0)" onclick="window.location.assign('/workspace?id=${encodeURIComponent(story.id)}')">View Story</a>

    </li>`
  ).join('');
}


const btnContainer = document.querySelector('.storyTypes>ul');
const createBtn = document.querySelector('.createBtn');
const closeBtn = document.querySelector('.closeBtn');
const createBlock = document.querySelector('.createBlock');
let selectedType = null;

function renderStoryTypes(storyTypes) {
  const btnContainer = document.querySelector('.storyTypes>ul');

  storyTypes.forEach(type => {
    const li = document.createElement("li");
    const typeBtn = document.createElement("button");

    typeBtn.textContent = type.name;
    typeBtn.dataset.id = type.id;

    typeBtn.addEventListener("click", () => {
      selectedType = type.id;
      renderDescription(type, storyTypes);
    });

    li.appendChild(typeBtn);
    btnContainer.appendChild(li);
  });
}


createBtn.addEventListener('click', () => {
    createBlock.style.display = "block";
});
closeBtn.addEventListener('click', () => {
    createBlock.style.display = "none";
});

function renderDescription(type, storyTypes) {
  const typeIntro = document.querySelector(".typeIntro");

  typeIntro.innerHTML = `
    <h3>About</h3>
    <p>${type.description}</p>
    <h4>Includes:</h4>
    <ul>
      ${type.includes.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;
}


const continueBtn = document.querySelector('.continueBtn');
const routeMap = {
  "T1": "/create/scavenger-hunt.html",
  "T2": "/create/quest.html",
  "T3": "/create/exploration-tour.html"
};

continueBtn.addEventListener('click', () => {
    if(selectedType == null){
        alert("Please select a story type before continuing.");
        return;
    }
    
    window.location.href = routeMap[selectedType];
});