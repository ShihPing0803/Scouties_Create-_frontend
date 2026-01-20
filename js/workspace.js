const steps = [
    {
        id: "step1",
        title: "Game details",
        description: "Add the first details of your game.",
        status: "completed"
    },
    {
        id: "step2",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "in-progress"
    },
    {
        id: "step3",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked"
    },
    {
        id: "step4",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked"
    },
    {
        id: "step5",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked"
    },
    {
        id: "step6",
        title: "Directions, challenges and non-fiction",
        description: "Create the route of the game and add directions, challenges and non-fiction stories for every checkpoint.",
        status: "locked"
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
        showButton: false,
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
steps.forEach(step => {
  const stepElement = document.createElement("li");
  stepElement.classList.add("step");

  const ui = statusUI.find(s => s.status === step.status);
  const isDisabled = ui.disableButton;
  const showBtn = ui.showButton;

  stepElement.innerHTML = `
    <span class="stepNumber p-3 fs-4 rounded-1 text-white bg-primary d-block" style="min-width:56px;">
        ${step.id}
    </span>
    <h3 class="p-3 mt-3 fs-3 fw-bold">${step.title}</h3>
    <img src="https://placehold.net/default.png" alt="Profile Picture" class="w-50 m-3 d-block mx-auto">
    <p class="mt-3 p-3">${step.description}</p>
    <div class="d-flex justify-content-end align-items-center gap-3 px-3 pb-3">
        <a href="#" class="stepTodoLink fw-semibold text-decoration-none">
        To-do list
        </a>

        <button
        class="stepButton btn stepStartBtn fw-semibold px-5 py-2 rounded-3 ${isDisabled ? "is-disabled" : ""}"
        ${isDisabled ? "disabled" : ""}>
        ${showBtn ? "Start" : ""}
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
