import type { Variants } from 'framer-motion';

// Stagger container variant for parent elements
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Fade in + slight upward movement for cards / items
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
    },
  },
};

// Scale in for modals
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 26,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// Button hover/tap preset
export const buttonHoverTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

// Decorative rotation entrance (for stars, medals, badges)
export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -30, scale: 0.7 },
  show: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 220,
      damping: 16,
      delay: 0.15,
    },
  },
};

// Backdrop fade
export const fadeInOut: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Word flash highlight when word is completed
export const wordFlash: Variants = {
  hidden: { textShadow: '0 0 0px rgba(34, 211, 238, 0)', color: '#22D3EE' },
  show: {
    textShadow: [
      '0 0 0px rgba(34, 211, 238, 0)',
      '0 0 16px rgba(34, 211, 238, 0.9)',
      '0 0 8px rgba(34, 211, 238, 0.5)',
    ],
    color: ['#22D3EE', '#67E8F9', '#22D3EE'],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Horizontal shake for wrong input
export const shakeX: Variants = {
  hidden: { x: 0 },
  show: {
    x: [-3, 3, -2, 2, -1, 1, 0],
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

// Illustration fade transition
export const fadeSwap: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } },
};

// Drawer slide from right
export const slideInRight: Variants = {
  hidden: { x: '100%' },
  show: { x: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
  exit: { x: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
};

// Popover scale fade
export const popoverScale: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } },
};

// Celebration star particle
export const particleStar = (angle: number, distance: number): Variants => ({
  hidden: { opacity: 0, scale: 0, x: 0, y: 0 },
  show: {
    opacity: [0, 1, 1, 0],
    scale: [0, 1.2, 1, 0.5],
    x: Math.cos((angle * Math.PI) / 180) * distance,
    y: Math.sin((angle * Math.PI) / 180) * distance - 20,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
});

// Collapsible panel height transition
export const expandCollapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

// Check if animation should run given a level
export type AnimationLevel = 'off' | 'simple' | 'standard' | 'rich';

export function animationEnabled(level: AnimationLevel, minLevel: AnimationLevel = 'simple'): boolean {
  const order: AnimationLevel[] = ['off', 'simple', 'standard', 'rich'];
  return order.indexOf(level) >= order.indexOf(minLevel);
}
