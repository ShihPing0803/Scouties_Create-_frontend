// Auth guard: already logged in → go to dashboard
if (sessionStorage.getItem('userId')) {
  window.location.href = 'dashboard.html';
}

// ── DOM-ready: wire up all static UI immediately ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const emailInput   = document.getElementById('email');
  const email2Input  = document.getElementById('email2');
  const pwdInput     = document.getElementById('pwd');
  const emailSection = document.getElementById('emailSection');
  const pwdSection   = document.getElementById('pwdSection');
  const continueBtn  = document.getElementById('continueBtn');
  const backBtn      = document.getElementById('backBtn');
  const eyeBtn       = document.getElementById('eyeBtn');
  const emailError   = document.getElementById('emailError');
  const pwdError     = document.getElementById('pwdError');
  const authTitle    = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');

  // Toggle password visibility
  eyeBtn.addEventListener('click', () => {
    const show = pwdInput.type === 'password';
    pwdInput.type    = show ? 'text' : 'password';
    eyeBtn.textContent = show ? '🙈' : '👁';
  });

  // Step 1: check email (can work with or without DB)
  continueBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    emailError.textContent = '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Please enter a valid email address.';
      return;
    }

    // Use DB if ready, otherwise fall back to register
    const checkEmail = () => {
      const user = DB.getUserByEmail(email);
      if (user) {
        email2Input.value      = email;
        emailSection.style.display = 'none';
        pwdSection.style.display   = 'block';
        authTitle.textContent      = 'Welcome back!';
        authSubtitle.textContent   = 'Enter your password to continue';
        pwdInput.focus();
      } else {
        sessionStorage.setItem('pendingEmail', email);
        window.location.href = 'register.html';
      }
    };

    // DB might already be ready
    if (window.DB && DB.getUserByEmail) {
      DB.ready.then(checkEmail);
    } else {
      sessionStorage.setItem('pendingEmail', email);
      window.location.href = 'register.html';
    }
  });

  // Allow Enter in email field
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') continueBtn.click(); });

  // Step 2: login
  document.getElementById('authForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = email2Input.value.trim();
    const pwd   = pwdInput.value;
    pwdError.textContent = '';

    DB.ready.then(() => {
      const user = DB.login(email, pwd);
      if (!user) {
        pwdError.textContent = 'Incorrect password. Please try again.';
        pwdInput.select();
        return;
      }
      sessionStorage.setItem('userId',   user.id);
      sessionStorage.setItem('userName', user.name);
      window.location.href = 'dashboard.html';
    });
  });

  // Back button
  backBtn.addEventListener('click', () => {
    pwdSection.style.display   = 'none';
    emailSection.style.display = 'block';
    authTitle.textContent      = 'Welcome back! 👋';
    authSubtitle.textContent   = 'Sign in to your creator account';
    pwdError.textContent       = '';
    emailInput.focus();
  });
});
