// public/user_view.js
async function displayRoomsForUser() {
  const container = document.getElementById('user-rooms-container');
  if (!container) return;

  container.innerHTML = '<p class="text-slate-500">Loading rooms...</p>';

  try {
    const response = await fetch('/api/rooms');
    const roomsData = await response.json();

    container.innerHTML = '';

    if (roomsData.length === 0) {
      container.innerHTML = '<p class="text-slate-500 text-center">No rooms are available at the moment. Please check back later.</p>';
      return;
    }

    roomsData.forEach(room => {
      const roomElement = `
        <div class="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <img src="${room.imageUrl}" alt="${room.name}" class="w-full sm:w-40 h-40 sm:h-24 rounded-md object-cover">
          <div class="flex-grow text-center sm:text-left">
            <h3 class="text-xl font-bold font-display text-slate-800">${room.name} <span class="text-base font-normal text-slate-500">(Room ${room.roomNumber})</span></h3>
            <p class="text-sm text-slate-600 mt-1">${room.description}</p>
          </div>
          <div class="flex-shrink-0 text-center sm:text-right">
            <p class="text-lg font-bold text-teal-600">₹${room.price.toLocaleString('en-IN')}</p>
            <p class="text-xs text-slate-500">per night</p>
          </div>
        </div>
      `;
      container.innerHTML += roomElement;
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    container.innerHTML = '<p class="text-red-500 text-center">Error loading rooms.</p>';
  }
}

// Initial Load
document.addEventListener('DOMContentLoaded', displayRoomsForUser);