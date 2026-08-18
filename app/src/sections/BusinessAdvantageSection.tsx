import { motion } from 'framer-motion';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

export default function BusinessAdvantageSection() {
  return (
    <section className="py-12 md:py-16 bg-fedex-purple">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInOnScroll>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-light text-white text-center"
          >
            Turn shipping into a business advantage
          </motion.h2>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
