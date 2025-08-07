import React from 'react';

const LogoIcon = ({ size = 24, color = "#1a73e8" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* YouTube play button background */}
      <rect x="2" y="6" width="20" height="12" rx="2" fill={color} opacity="0.1"/>
      
      {/* YouTube play button */}
      <path 
        d="M10 9L16 12L10 15V9Z" 
        fill={color}
      />
      
      {/* Search magnifying glass */}
      <circle cx="18" cy="6" r="3" stroke={color} strokeWidth="2" fill="none"/>
      <path 
        d="M20.5 8.5L22 10" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* Video lines representing content */}
      <rect x="4" y="8" width="8" height="1" fill={color} opacity="0.6"/>
      <rect x="4" y="10" width="6" height="1" fill={color} opacity="0.6"/>
      <rect x="4" y="12" width="7" height="1" fill={color} opacity="0.6"/>
    </svg>
  );
};

export default LogoIcon;
