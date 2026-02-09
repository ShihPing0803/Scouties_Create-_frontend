const emailSection = document.getElementById('emailSection');
const pwdSection = document.getElementById('pwdSection');
const continueBtn = document.getElementById('continueBtn');
const loginBtn = document.getElementById('loginBtn');

continueBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    if(!email){
        alert('Please enter your email.');
        return;
    }

    try{
        const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
        
        if(response.ok){
            const users = await response.json();
            if(users.length > 0){
                pwdSection.style.display = 'block';
                emailSection.style.display = 'none';
            }
            else{
                window.location.href = './register.html';
            }
        }
        else{
            throw new Error('Network response was not ok');
        }
        
    }
    catch(error){
        console.error('Error during authentication:', error);
        alert('伺服器錯誤，請稍後再試');
    }
});

loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const pwd = document.getElementById('pwd').value; 
  try {

    const url = `http://localhost:3000/users?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('Network error');

    const users = await res.json();
    if (users.length === 0) {
      alert('帳號或密碼錯誤');
      return;
    }

    const user = users[0]; 
    sessionStorage.setItem('userId', user.id);
    sessionStorage.setItem('userName', user.name);

    window.location.href = `/dashboard.html`;

  } catch (err) {
    console.error(err);
    alert('伺服器錯誤，請稍後再試');
  }
});


