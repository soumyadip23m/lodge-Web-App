// public/script.js
async function displayRoomsOnMainSite() {
  const container = document.getElementById('rooms-container');
  if (!container) return;

  container.innerHTML = '<p class="text-slate-500">Loading rooms...</p>';

  try {
    const response = await fetch('/api/rooms');
    const roomsData = await response.json();

    container.innerHTML = '';

    if (roomsData.length === 0) {
      container.innerHTML = '<p class="text-slate-500 col-span-full text-center">No rooms are available at the moment. Please check back later.</p>';
      return;
    }

    roomsData.forEach(room => {
      const roomCard = `
        <div class="bg-white rounded-xl shadow-md overflow-hidden card-hover-effect">
          <img src="${room.imageUrl}" alt="${room.name}" class="w-full h-60 object-cover">
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-2xl font-bold font-display text-slate-800">${room.name}</h3>
              <span class="text-sm font-semibold bg-teal-100 text-teal-800 px-2 py-1 rounded-full">Room ${room.roomNumber}</span>
            </div>
            <p class="text-slate-600 mb-6">${room.description}</p>
            <div class="flex justify-between items-center">
              <span class="text-2xl font-bold text-teal-600">₹${room.price.toLocaleString('en-IN')} <span class="text-base font-normal text-slate-500">/ night</span></span>
              <a href="#contact" class="btn-gradient text-white px-5 py-2 rounded-full font-semibold text-sm">Book Now</a>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += roomCard;
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    container.innerHTML = '<p class="text-red-500 col-span-full text-center">Error loading rooms.</p>';
  }
}

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
  mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

// Contact form submission
const contactForm = document.getElementById('contact-form');
const feedbackEl = document.getElementById('form-feedback');

if (contactForm && feedbackEl) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    feedbackEl.classList.remove('hidden');
    feedbackEl.classList.add('bg-green-100', 'text-green-800');
    feedbackEl.textContent = 'Thank you! Your message has been sent.';

    contactForm.reset();

    setTimeout(() => {
      feedbackEl.classList.add('hidden');
    }, 5000);
  });
}

// Initial Load
document.addEventListener('DOMContentLoaded', displayRoomsOnMainSite);