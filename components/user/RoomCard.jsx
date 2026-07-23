'use client';

import { useState, useEffect, useCallback } from 'react';

export default function RoomCard({ room, onSelect }) {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Combine room and bathroom images with category tags
  const roomPics = (room.room_images || []).map((url) => ({ url, category: 'Room View' }));
  const bathPics = (room.bathroom_images || []).map((url) => ({ url, category: 'Bathroom View' }));
  const allImages = [...roomPics, ...bathPics];

  // Fallback if the admin hasn't uploaded any pictures yet
  if (allImages.length === 0) {
    allImages.push({
      url: 'https://placehold.co/800x600?text=No+Images+Available',
      category: 'No Photo',
    });
  }

  // 2. Navigation Handlers
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  }, [allImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // 3. Keyboard Navigation Support (Arrows + Escape)
  useEffect(() => {
    if (!isCarouselOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') setIsCarouselOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCarouselOpen, nextSlide, prevSlide]);

  const openGallery = (index = 0) => {
    setCurrentIndex(index);
    setIsCarouselOpen(true);
  };

  return (
    <>
      {/* MAIN ROOM CARD - LUXURY DARK THEME EQUIPPED */}
      <div className="bg-surface/90 dark:bg-surface/60 text-content border border-border dark:border-slate-800/80 rounded-2xl shadow-lg hover:shadow-2xl dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:border-primary/50 dark:hover:border-primary/40 transition-all duration-500 flex flex-col overflow-hidden group/card animate-fade-in-up backdrop-blur-sm">
        {/* Thumbnail Image Container */}
        <div
          onClick={() => openGallery(0)}
          className="relative h-56 w-full cursor-pointer overflow-hidden bg-background"
        >
          <img
            src={allImages[0].url}
            alt={room.name}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 opacity-95 group-hover/card:opacity-100"
          />

          {/* Room Type Badge */}
          <div className="absolute top-3 right-3 bg-surface/90 text-content backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold shadow">
            {room.type} Room
          </div>

          {/* Photo Count / Click to Expand Overlay */}
          <div className="absolute bottom-3 left-3 bg-black/75 hover:bg-black/85 transition-colors backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center space-x-1.5 shadow-lg">
            <span>📷</span>
            <span>{allImages.length} {allImages.length === 1 ? 'Photo' : 'Photos'}</span>
            <span className="text-gray-300 font-normal">| Click to view</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-baseline gap-2">
              <h3 className="text-xl font-bold text-content leading-snug">{room.name}</h3>
              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                Room #{room.room_number}
              </span>
            </div>

            {/* Included Amenities Section */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase text-muted tracking-wider">
                Included Amenities
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {room.amenities?.length > 0 ? (
                  room.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted italic">Standard amenities included</span>
                )}
              </div>
            </div>
          </div>

          {/* Price & Action Button Footer */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-content">
                ₹{room.price_per_night}
              </span>
              <span className="text-muted text-sm"> / night</span>
            </div>

            <button
              onClick={() => onSelect(room)}
              disabled={!room.is_available}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-300 ${room.is_available
                  ? 'bg-gradient-to-r from-primary via-indigo-600 to-accent hover:from-primary-hover hover:to-cyan-400 text-white shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95'
                  : 'bg-surface-hover text-muted border border-border/50 cursor-not-allowed opacity-60'
                }`}
            >
              {room.is_available ? '⚡ Book Room' : 'Currently Booked'}
            </button>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN IMAGE CAROUSEL MODAL */}
      {/* Note: High-contrast black backdrop is kept intentionally for optimal photo viewing */}
      {isCarouselOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">

          {/* Top Bar: Room Info & Close Button */}
          <div className="flex justify-between items-center text-white z-10 max-w-7xl w-full mx-auto">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">{room.name}</h3>
              <p className="text-xs text-gray-400">
                Room #{room.room_number} • {allImages[currentIndex].category}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/15">
                {currentIndex + 1} / {allImages.length}
              </span>
              <button
                onClick={() => setIsCarouselOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors text-xl leading-none w-10 h-10 flex items-center justify-center font-bold border border-white/15"
                aria-label="Close Gallery"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Image Viewport & Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden max-w-6xl w-full mx-auto">
            {/* Left Arrow */}
            {allImages.length > 1 && (
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 z-10 p-3 sm:p-4 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110 focus:outline-none border border-white/20"
                aria-label="Previous Photo"
              >
                ◀
              </button>
            )}

            {/* Current Large Image */}
            <div className="relative max-h-[70vh] max-w-full flex items-center justify-center">
              <img
                src={allImages[currentIndex].url}
                alt={`${room.name} - ${allImages[currentIndex].category}`}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
              />
              <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg uppercase tracking-wider border border-white/20">
                {allImages[currentIndex].category}
              </span>
            </div>

            {/* Right Arrow */}
            {allImages.length > 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 z-10 p-3 sm:p-4 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110 focus:outline-none border border-white/20"
                aria-label="Next Photo"
              >
                ▶
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex justify-center items-center gap-2 overflow-x-auto py-2 max-w-4xl w-full mx-auto no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden transition-all duration-200 ${currentIndex === idx
                    ? 'ring-4 ring-primary scale-105 opacity-100 shadow-lg'
                    : 'opacity-40 hover:opacity-80 ring-1 ring-white/20'
                    }`}
                >
                  <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-semibold text-white text-center py-0.5 truncate px-1">
                    {img.category.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}