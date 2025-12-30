const count = document.querySelector('small');
const textarea = document.querySelector('textarea');
textarea.addEventListener('input', () => {
    count.textContent = `${textarea.value.length}/350`;
});

const completeBtn = document.querySelector('.submitBtn');
const city = document.querySelector('#city');
const title = document.querySelector('#title');

function setErrorMsg(element, message){
    const error = element.nextElementSibling;
    error.textContent = message;
}

function clearErrorMsg(element){
    const error = element.nextElementSibling;
    error.textContent = "";
}

function validateForm(){
    const description = textarea.value.trim();
    const cityValue = city.value.trim();
    const titleValue = title.value.trim();
    const today = new Date().toISOString().split("T")[0];
    const storyType = document.body.getAttribute('data-story-type') || Null;

    let isValid = true;

    //When user starts typing, clear error message
    [city, title, textarea].forEach(el => {
        el.addEventListener('input', () => clearErrorMsg(el));
    });

    
    //Validate city
    if (!cityValue){
        setErrorMsg(city, "Please enter a city for your story.");
        isValid = false;
    }

    //Validate title
    if (!titleValue){
        setErrorMsg(title, "Please enter a title for your story.");
        isValid = false;
    }

    //Validate description
    if (!description){
        setErrorMsg(textarea, "Please enter some description for your story.");
        isValid = false;
    }

    if (isValid === false) return null;

    //Scroll to first error if any
    if (!isValid) {
        const firstError = document.querySelector('.errorMsg:not(:empty)');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return null;
    }

    return{
      "title": titleValue,
      "order": 2,
      "type": storyType,
      "step": "Step 2",
      "city": cityValue,
      "last_update": today,
      "created_at": today,
      "story_owner": {
        "name": "Shih Ping",
        "email": "aa0421626@gmail.com"
      },
      "editor": null,
      "writer": null,
      "languages": [
        "EN"
      ],
      "statistics": null
    
    };
};
completeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const payload = validateForm();
    if(!payload) return;
    completeBtn.textContent = "Processing...";
    
    //Send data to server
    fetch("http://localhost:3000/stories", {
        method: "POST",                       
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Saved:", data); 
        //window.location.href = `workspace.html/${data.id}`;
        window.location.href = `http://localhost:8000/dashboard.html`;
    })
    .catch(err => console.error(err));
});