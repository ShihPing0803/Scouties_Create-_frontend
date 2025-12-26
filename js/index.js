const emailSection = document.getElementById('emailSection');
const pwdSection = document.getElementById('pwdSection');
const continueBtn = document.getElementById('continueBtn');
const loginBtn = document.getElementById('loginBtn');

continueBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    console.log(email);
    try{
        const response = await fetch('/api/checkAuth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        if(response.ok){
            pwdSection.style.display = 'block';
            emailSection.style.display = 'none';
        }
        else{
            window.location.href = './register.html';
        }
    }
    catch(error){
        window.location.href = './dashboard.html';
        console.error('Error during authentication:', error);
    }
});

loginBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try{
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if(response.ok){
            window.location.href = '/dashboard.html';
        } 
    }
    catch(error){
        window.location.href = '/dashboard.html';
        console.error('Error during login:', error);
    }
});

