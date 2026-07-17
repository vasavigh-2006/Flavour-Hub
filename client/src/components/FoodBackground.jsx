import { useEffect, useState } from 'react';

const FoodBackground = () => {
  const [currentImage, setCurrentImage] = useState(0);

  // High-quality food photography URLs - vibrant, appetizing, premium
  const foodImages = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1920&h=1080&fit=crop&q=80',
  ];

  useEffect(() => {
    // Preload images for smooth transitions
    foodImages.forEach((url) => {
      const img = new Image();
      img.src = url;
    });

    // Rotate background images every 30 seconds for variety
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % foodImages.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background Images with smooth transitions */}
      {foodImages.map((url, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ))}

      {/* Gradient overlay — lighter in light mode so food photos show through vividly */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-amber-50/30 to-white/40 dark:from-black/70 dark:via-black/60 dark:to-black/70 transition-colors duration-500" />

      {/* Soft vignette around edges */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/10 dark:to-black/50" />

      {/* Warm orange shimmer for premium feel — stronger in light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-amber-400/10 animate-pulse-slow" />
    </div>
  );
};

export default FoodBackground;

