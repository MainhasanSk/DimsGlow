import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fill,
  priority,
  sizes,
  className = '',
  style,
  width,
  height,
  ...rest
}) => {
  const fillStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        inset: 0,
        objectFit: 'cover',
        imageRendering: '-webkit-optimize-contrast',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
      style={{ ...fillStyle, ...style }}
      className={className}
      {...rest}
    />
  );
};

export default Image;
