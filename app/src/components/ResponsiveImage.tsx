interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspect?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  fit?: 'cover' | 'contain';
}

export default function ResponsiveImage({
  src, alt, className = '', aspect, loading = 'lazy', fit = 'cover',
}: ResponsiveImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={["w-full h-auto max-w-full rounded-lg", fit === 'cover' ? 'object-cover' : 'object-contain', className].join(' ')}
      style={aspect ? { aspectRatio: aspect } : undefined}
    />
  );
}
