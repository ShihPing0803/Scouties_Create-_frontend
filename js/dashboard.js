import stories from "./mockData.js";

const storiesList = document.querySelector('.stories');

storiesList.innerHTML = stories.map(story =>
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