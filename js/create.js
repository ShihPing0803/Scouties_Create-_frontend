const count = document.querySelector('small');
const textarea = document.querySelector('textarea');
textarea.addEventListener('input', () => {
    count.textContent = `${textarea.value.length}/350`;
});

const completeBtn = document.querySelector('.submitBtn');
completeBtn.addEventListener('submit', (e) => {
    
});