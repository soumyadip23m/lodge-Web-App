// public/profile.js
// Security Check
if (localStorage.getItem('isLoggedIn') !== 'user') {
    window.location.href = './login.html';
}

// Get DOM Elements
const profileForm = document.getElementById('profile-form');
const profileNameInput = document.getElementById('profileName');
const profileEmailInput = document.getElementById('profileEmail');
const profilePasswordInput = document.getElementById('profilePassword');
const profileFeedback = document.getElementById('profile-feedback');
const logoutButton = document.getElementById('logout-button');
const photoUpload = document.getElementById('photo-upload');
const photoPreview = document.getElementById('profile-photo-preview');

// Populate Profile Form on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('userEmail');
    
    if (userEmail) {
        try {
            const response = await fetch(`/api/users/profile?email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const user = await response.json();

            if (response.ok) {
                profileNameInput.value = user.name || '';
                profileEmailInput.value = user.email || '';
                
                const userPhotoKey = 'userProfilePhoto_' + userEmail;
                const userPhoto = localStorage.getItem(userPhotoKey);
                if (userPhoto) {
                    photoPreview.src = userPhoto;
                }
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            profileFeedback.textContent = 'Error loading profile.';
            profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-red-100 text-red-800';
            profileFeedback.classList.remove('hidden');
        }
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
        photoPreview.src = imageUrl; 
        
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            const userPhotoKey = 'userProfilePhoto_' + userEmail;
            localStorage.setItem(userPhotoKey, imageUrl);
        }
    };
});

// Handle Profile Update
profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userEmail = localStorage.getItem('userEmail');
    const updatedData = {
        name: profileNameInput.value,
        email: userEmail,
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
            localStorage.setItem('userName', updatedData.name);
            profileFeedback.textContent = 'Profile updated successfully!';
            profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-green-100 text-green-800';
            profilePasswordInput.value = '';
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        profileFeedback.textContent = err.message || 'An error occurred while updating.';
        profileFeedback.className = 'text-center p-4 mt-4 rounded-lg bg-red-100 text-red-800';
    }
    profileFeedback.classList.remove('hidden');
    setTimeout(() => profileFeedback.classList.add('hidden'), 3000);
});

// Handle Logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = './index.html';
});