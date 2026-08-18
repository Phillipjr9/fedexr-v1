import { Link } from 'react-router-dom';

type Props = { className?: string; height?: number; to?: string | null; variant?: 'color' | 'white' };

export default function FedExLogo({ className = '', height = 28, to = '/', variant = 'color' }: Props) {
  const fed = variant === 'white' ? '#FFFFFF' : '#4D148C';
  const ex = variant === 'white' ? '#FFB366' : '#FF6600';
  const mark = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 44" height={height} className={className} role="img" aria-label="FedEx">
      <text x="0" y="34" fontFamily="Arial Black, Arial, sans-serif" fontSize="36" fontWeight="900">
        <tspan fill={fed}>Fed</tspan><tspan fill={ex}>Ex</tspan>
      </text>
    </svg>
  );
  if (to === null) return mark;
  return <Link to={to} className="inline-flex items-center" aria-label="FedEx home">{mark}</Link>;
}
