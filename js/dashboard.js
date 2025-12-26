import mockData from "./mockData.js";

const storiesList = document.querySelector('.stories');

storiesList.innerHTML = mockData.stories.map(story =>
    `<li class="story-card">
        <div class="basic-info">
            <p><span>#${story.id}</span>${story.title}</p>
            <p><span>City</span>${story.city}</p>
            <time><span>Last updated</span> ${story.last_update}</time>
            <p><span>Owner</span> ${story.game_owner.name} (${story.game_owner.email})</p>
            <p><span>Editer</span>${story.editor ? story.editor: 'No assigned yet'}</p>
        </div>
        <button><a href="#">View Story</a></button>
    </li>`
).join('');

const btnContainer = document.querySelector('.storyTypes>ul');
const createBtn = document.querySelector('.createBtn');
const closeBtn = document.querySelector('.closeBtn');
const createBlock = document.querySelector('.createBlock');
let selectedType = null;

createBtn.addEventListener('click', () => {
    createBlock.style.display = "block";
});
closeBtn.addEventListener('click', () => {
    createBlock.style.display = "none";
});

function renderDescription(typeId){
    const typeIntro = document.querySelector(".typeIntro");
    typeIntro.innerHTML = `
        <h3>About</h3>
        <p>${mockData.storyTypes.find(type => type.id === typeId).description}</p>
        <h4>Includes:</h4>
        <ul>
            ${mockData.storyTypes.find(type => type.id === typeId).includes.map(item => 
                `<li>${item}</li>`
            )}
        </ul>
    `;
}

mockData.storyTypes.forEach(type => {
    const li = document.createElement("li");
    const typeBtn = document.createElement("button");
    typeBtn.textContent = type.name;
    typeBtn.dataset.id = type.id;
    typeBtn.addEventListener("click",()=>{
        selectedType = type.id;
        console.log(`Selected story type: ${type.name}`);
        renderDescription(selectedType);
    });
    li.appendChild(typeBtn);
    btnContainer.appendChild(li);
});