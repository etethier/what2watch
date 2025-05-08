'use client';

import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import TrailerModal from './TrailerModal';

interface TrailerButtonProps {
  title: string;
  year?: number;
  type?: 'movie' | 'tv';
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon' | 'minimal';
}

export default function TrailerButton({ 
  title, 
  year, 
  type, 
  className = '', 
  variant = 'primary' 
}: TrailerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Default classes for different variants
  const buttonClasses = {
    primary: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300',
    secondary: 'bg-white text-pink-500 border border-pink-500 py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:bg-pink-50 transition-all duration-300',
    icon: 'bg-pink-500 text-white p-2 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all duration-300',
    minimal: 'bg-gray-100 text-gray-700 py-2 rounded-md flex items-center justify-center hover:bg-gray-200 transition-colors'
  };

  return (
    <>
      <button 
        onClick={openModal}
        className={`${buttonClasses[variant]} ${className}`}
        aria-label={`Watch ${title} trailer`}
      >
        <FaPlay size={variant === 'icon' ? 16 : 14} />
        {variant !== 'icon' && variant !== 'minimal' && <span>Watch Trailer</span>}
        {variant === 'minimal' && <span className="sr-only md:not-sr-only md:ml-1">Trailer</span>}
      </button>

      <TrailerModal
        title={title}
        year={year}
        type={type}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
} 