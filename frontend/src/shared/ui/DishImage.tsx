import { useState } from 'react';
import { PictureOutlined } from '@ant-design/icons';
import { copy } from '../copy/en';

interface DishImageProps {
  imageUrl: string | null;
  alt: string;
  large?: boolean;
}

/**
 * Dish image with an English placeholder state. Missing or broken images
 * never block the ordering flow.
 */
export function DishImage({ imageUrl, alt, large }: DishImageProps) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        className={`webox-dish-image-fallback${large ? ' webox-dish-image-fallback--large' : ''}`}
        role="img"
        aria-label={copy.menu.imageComingSoon}
      >
        <PictureOutlined style={{ fontSize: 28 }} />
        <span>{copy.menu.imageComingSoon}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: '100%', display: 'block' }}
    />
  );
}
