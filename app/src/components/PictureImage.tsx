import ResponsiveImage from '@/components/ResponsiveImage';

export default function PictureImage({ src, alt, className, aspect = '16 / 9', loading = 'lazy' as const }: { src: string; alt: string; className?: string; aspect?: string; loading?: 'lazy' | 'eager' }) {
  return <ResponsiveImage src={src} alt={alt} className={className} aspect={aspect} loading={loading} />;
}
