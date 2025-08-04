// public/admin.js
// Security Check
if (localStorage.getItem('isLoggedIn') !== 'admin') {
  window.location.href = './login.html';
}

// Get Modal Elements
const editModal = document.getElementById('edit-room-modal');
const closeModalButton = document.getElementById('close-modal-button');
const editRoomForm = document.getElementById('edit-room-form');

// Function to Display Current Rooms
async function displayCurrentRooms() {
  const container = document.getElementById('current-rooms-container');
  if (!container) return;

  container.innerHTML = '<p class="text-slate-500">Loading rooms...</p>';

  try {
    const response = await fetch('/api/rooms');
    const roomsData = await response.json();

    container.innerHTML = '';

    if (roomsData.length === 0) {
      container.innerHTML = '<p class="text-slate-500">No rooms have been added yet.</p>';
      return;
    }

    roomsData.forEach(room => {
      const roomElement = `
        <div class="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between" data-room-id="${room._id}">
          <div class="flex items-center flex-grow min-w-0">
            <img src="${room.imageUrl}" alt="${room.name}" class="w-16 h-16 rounded-md object-cover mr-4">
            <div class="min-w-0">
              <h3 class="font-bold text-slate-800 truncate">${room.name}</h3>
              <p class="text-sm text-slate-500">Room #${room.roomNumber} | ₹${room.price.toLocaleString('en-IN')}/night</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button class="text-blue-500 hover:text-blue-700 font-semibold mr-4" onclick="openEditModal('${room._id}')">Edit</button>
            <button class="text-red-500 hover:text-red-700 font-semibold" onclick="deleteRoom('${room._id}')">Delete</button>
          </div>
        </div>
      `;
      container.innerHTML += roomElement;
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    container.innerHTML = '<p class="text-red-500">Error loading rooms.</p>';
  }
}

// Function to Add a New Room
async function addRoom(event) {
  event.preventDefault();
  const form = event.target;
  const feedbackEl = document.getElementById('admin-feedback');
  const imageFile = form.imageUpload.files[0];

  if (!imageFile) {
    alert('Please select an image for the room.');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  reader.onload = async () => {
    const price = parseInt(form.roomPrice.value);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price greater than zero.');
      return;
    }

    const newRoom = {
      name: form.roomName.value.trim(),
      roomNumber: form.roomNumber.value.trim(),
      price: price,
      imageUrl: reader.result,
      description: form.description.value.trim()
    };

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add room');
      }

      feedbackEl.classList.remove('hidden');
      feedbackEl.classList.add('bg-green-100', 'text-green-800');
      feedbackEl.textContent = 'Room added successfully!';
      
      setTimeout(() => {
        feedbackEl.classList.add('hidden');
      }, 3000);

      form.reset();
      document.getElementById('imagePreview').classList.add('hidden');
      displayCurrentRooms();
    } catch (err) {
      console.error('Error adding room:', err);
      alert(err.message);
    }
  };
  reader.onerror = (error) => {
    console.error('Error reading file:', error);
    alert('There was an error uploading the image.');
  };
}

// Function to Delete a Room
async function deleteRoom(roomId) {
  if (confirm('Are you sure you want to delete this room?')) {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete room');
      displayCurrentRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      alert('There was an error deleting the room.');
    }
  }
}

// Functions for Edit Modal
async function openEditModal(roomId) {
  try {
    const response = await fetch(`/api/rooms/${roomId}`);
    if (!response.ok) throw new Error('Room not found');
    const roomToEdit = await response.json();

    document.getElementById('editRoomId').value = roomToEdit._id;
    document.getElementById('editRoomName').value = roomToEdit.name || '';
    document.getElementById('editRoomNumber').value = roomToEdit.roomNumber || '';
    document.getElementById('editRoomPrice').value = roomToEdit.price || '';
    document.getElementById('editDescription').value = roomToEdit.description || '';
    editModal.classList.remove('hidden');
  } catch (err) {
    console.error('Error fetching room:', err);
    alert('Error loading room details. Please refresh the page.');
  }
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

async function saveRoomChanges(event) {
  event.preventDefault();
  const roomId = document.getElementById('editRoomId').value;
  const price = parseInt(document.getElementById('editRoomPrice').value);
  if (isNaN(price) || price <= 0) {
    alert('Please enter a valid price greater than zero.');
    return;
  }

  const updatedRoom = {
    name: document.getElementById('editRoomName').value.trim(),
    roomNumber: document.getElementById('editRoomNumber').value.trim(),
    price: price,
    description: document.getElementById('editDescription').value.trim()
  };

  try {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRoom)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update room');
    }

    displayCurrentRooms();
    closeEditModal();
  } catch (err) {
    console.error('Error updating room:', err);
    alert(err.message);
  }
}

// Event Listeners
const addRoomForm = document.getElementById('add-room-form');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');

if (addRoomForm) {
  addRoomForm.addEventListener('submit', addRoom);
}

if (imageUpload && imagePreview) {
  imageUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });
}

closeModalButton.addEventListener('click', closeEditModal);
editRoomForm.addEventListener('submit', saveRoomChanges);

// Initial Load
document.addEventListener('DOMContentLoaded', displayCurrentRooms);