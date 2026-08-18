import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertBannerProps {
  message: string;
  linkText: string;
  linkHref: string;
}

export default function AlertBanner({ message, linkText, linkHref }: AlertBannerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-fedex-info border-l-4 border-fedex-link py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Info className="h-5 w-5 text-fedex-link flex-shrink-0 mt-0.5" />
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-gray-800">{message}</span>
          <Link to={linkHref} className="text-fedex-link hover:text-fedex-link-dark underline font-medium">{linkText}</Link>
        </div>
      </div>
    </motion.div>
  );
}
