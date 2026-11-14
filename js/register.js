if (sessionStorage.getItem('userId')) {
  window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill email if coming from login page
  const pending = sessionStorage.getItem('pendingEmail');
  if (pending) document.getElementById('regEmail').value = pending;

  const eyeBtn = document.getElementById('eyeBtn');
  const regPwd = document.getElementById('regPwd');
  eyeBtn.addEventListener('click', () => {
    const show = regPwd.type === 'password';
    regPwd.type        = show ? 'text' : 'password';
    eyeBtn.textContent = show ? '🙈' : '👁';
  });

  document.getElementById('registerForm').addEventListener('submit', e => {
    e.preventDefault();

    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pwd   = document.getElementById('regPwd').value;
    const pwd2  = document.getElementById('regPwd2').value;

    // Clear errors
    ['nameError','regEmailError','pwdError','pwd2Error'].forEach(id => {
      document.getElementById(id).textContent = '';
    });

    let valid = true;
    if (!name) {
      document.getElementById('nameError').textContent = 'Please enter your name.';
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('regEmailError').textContent = 'Please enter a valid email.';
      valid = false;
    }
    if (pwd.length < 8) {
      document.getElementById('pwdError').textContent = 'Password must be at least 8 characters.';
      valid = false;
    }
    if (pwd !== pwd2) {
      document.getElementById('pwd2Error').textContent = 'Passwords do not match.';
      valid = false;
    }
    if (!valid) return;

    DB.ready.then(() => {
      if (DB.getUserByEmail(email)) {
        document.getElementById('regEmailError').textContent = 'An account with this email already exists.';
        return;
      }
      const user = DB.createUser({ name, email, pwd, avatar: null });
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.setItem('userId',   user.id);
      sessionStorage.setItem('userName', user.name);
      window.location.href = 'dashboard.html';
    });
  });
});
