// public/register.js
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      registerError.textContent = result.message || 'An error occurred during registration.';
      registerError.classList.remove('hidden');
      return;
    }

    alert('Registration successful! Please log in.');
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Registration error:', err);
    registerError.textContent = 'An error occurred during registration.';
    registerError.classList.remove('hidden');
  }
});