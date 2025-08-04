// public/login.js
// Login Type Toggle
const userToggle = document.getElementById('user-toggle');
const adminToggle = document.getElementById('admin-toggle');
const loginTypeInput = document.getElementById('loginType');
const loginTitle = document.getElementById('login-title');
const emailInput = document.getElementById('email');

userToggle.addEventListener('click', () => {
  loginTypeInput.value = 'user';
  loginTitle.textContent = 'User Login';
  emailInput.placeholder = 'your.email@example.com';
  userToggle.classList.add('active');
  userToggle.classList.remove('text-slate-500');
  adminToggle.classList.remove('active');
  adminToggle.classList.add('text-slate-500');
});

adminToggle.addEventListener('click', () => {
  loginTypeInput.value = 'admin';
  loginTitle.textContent = 'Admin Login';
  emailInput.placeholder = 'admin@bayview.com';
  adminToggle.classList.add('active');
  adminToggle.classList.remove('text-slate-500');
  userToggle.classList.remove('active');
  userToggle.classList.add('text-slate-500');
});

// Event Listener for the Login Form
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = emailInput.value;
  const password = document.getElementById('password').value;
  const loginType = loginTypeInput.value;

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, loginType })
    });

    const result = await response.json();

    if (!response.ok) {
      errorMessage.textContent = result.message || 'Invalid email or password.';
      errorMessage.classList.remove('hidden');
      return;
    }

    localStorage.setItem('isLoggedIn', result.role);
    if (result.role === 'user') {
      localStorage.setItem('userName', result.name);
      localStorage.setItem('userEmail', result.email);
      window.location.href = './profile.html';
    } else {
      window.location.href = './admin.html';
    }
  } catch (err) {
    console.error('Login error:', err);
    errorMessage.textContent = 'An error occurred during login.';
    errorMessage.classList.remove('hidden');
  }
});

// Password Visibility Toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

togglePassword.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  eyeIcon.classList.toggle('hidden');
  eyeOffIcon.classList.toggle('hidden');
});