'use client';

import React, { useState, useEffect } from 'react';

const FALLBACKS = {
  'Electronics':  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
  'Smart Home':   'https://images.unsplash.com/photo-1558002038-1091a166111c?w=800&q=80',
  'Wellness':     'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80',
  'Workspace':    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
  'Audio':        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  'Fitness':      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'default':      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
};

const getFallback = (cat) => FALLBACKS[cat] || FALLBACKS['default'];

const ProductImage = ({ src, alt, category, className, width, height, priority, fill, onImageError, style, ...props }) => {
  const validSrc = src && src.trim() !== '' ? src : null;
  const [imgSrc, setImgSrc] = useState(validSrc || getFallback(category));

  useEffect(() => {
    const v = src && src.trim() !== '' ? src : null;
    setImgSrc(v || getFallback(category));
  }, [src, category]);

  const handleError = () => {
    const fallback = getFallback(category);
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    } else if (onImageError) {
      onImageError();
    }
  };

  // Always use plain <img> — works for local /product-images/ and external URLs
  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      style={{
        objectFit: 'cover',
        width: fill ? '100%' : (width || undefined),
        height: fill ? '100%' : (height || undefined),
        display: 'block',
        ...style,
      }}
    />
  );
};

export default ProductImage;
