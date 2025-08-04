// public/admin_profile.js
// Security Check
if (localStorage.getItem('isLoggedIn') !== 'admin') {
    window.location.href = './login.html';
}

// Get DOM Elements
const profileForm = document.getElementById('admin-profile-form');
const profileEmailInput = document.getElementById('profileEmail');
const profilePasswordInput = document.getElementById('profilePassword');
const profileFeedback = document.getElementById('profile-feedback');
const logoutButton = document.getElementById('logout-button');
const photoUpload = document.getElementById('photo-upload');
const photoPreview = document.getElementById('profile-photo-preview');

// Load Profile Data on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    const adminEmail = 'admin@bayview.com'; // Hardcoded admin email

    try {
        const response = await fetch(`/api/users/profile?email=${encodeURIComponent(adminEmail)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const admin = await response.json();

        if (response.ok) {
            profileEmailInput.value = admin.email || 'admin@bayview.com';
            
            // Load and display saved profile photo
            const savedPhoto = localStorage.getItem('adminProfilePhoto');
            if (savedPhoto) {
                photoPreview.src = savedPhoto;
            }
        } else {
            throw new Error('Failed to load admin profile');
        }
    } catch (err) {
        console.error('Error loading admin profile:', err);
        profileFeedback.textContent = 'Error loading profile.';
        profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-red-100 text-red-800';
        profileFeedback.classList.remove('hidden');
    }
});

// Handle Profile Photo Upload
photoUpload.addEventListener('change', () => {
    const file = photoUpload.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const imageUrl = reader.result;
        photoPreview.src = imageUrl; // Update preview
        localStorage.setItem('adminProfilePhoto', imageUrl); // Save to localStorage
    };
});

// Handle Profile Form Submission
profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const adminEmail = 'admin@bayview.com'; // Hardcoded admin email
    const updatedData = {
        email: adminEmail,
        password: profilePasswordInput.value || undefined // Only update if provided
    };

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            profileFeedback.textContent = 'Admin profile updated successfully!';
            profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-green-100 text-green-800';
            profilePasswordInput.value = '';
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
    } catch (err) {
        console.error('Error updating admin profile:', err);
        profileFeedback.textContent = err.message || 'An error occurred while updating.';
        profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-red-100 text-red-800';
    }
    profileFeedback.classList.remove('hidden');
    setTimeout(() => profileFeedback.classList.add('hidden'), 3000);
});

// Handle Logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = './index.html';
});