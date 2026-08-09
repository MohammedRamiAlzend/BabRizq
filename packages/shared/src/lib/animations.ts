import { gsap } from 'gsap';

// Common animation utilities using GSAP
export const animations = {
  // Fade in animation
  fadeIn: (element: Element, duration: number = 0.5, delay: number = 0) => {
    return gsap.fromTo(element,
      { opacity: 0 },
      { opacity: 1, duration, delay, ease: 'power2.out' }
    );
  },

  // Slide in from direction
  slideIn: (
    element: Element,
    direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
    duration: number = 0.6,
    delay: number = 0
  ) => {
    const from = { x: 0, y: 0 };
    switch (direction) {
      case 'left':
        from.x = -50;
        break;
      case 'right':
        from.x = 50;
        break;
      case 'top':
        from.y = -50;
        break;
      case 'bottom':
        from.y = 50;
        break;
    }

    return gsap.fromTo(element,
      { ...from, opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration, delay, ease: 'power2.out' }
    );
  },

  // Scale animation
  scaleIn: (element: Element, duration: number = 0.4, delay: number = 0) => {
    return gsap.fromTo(element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: 'back.out(1.7)' }
    );
  },

  // Bounce animation
  bounce: (element: Element, duration: number = 0.6, delay: number = 0) => {
    return gsap.fromTo(element,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration, delay, ease: 'bounce.out' }
    );
  },

  // Stagger animation for multiple elements
  staggerIn: (
    elements: Element[] | NodeListOf<Element>,
    duration: number = 0.3,
    stagger: number = 0.1,
    delay: number = 0
  ) => {
    return gsap.fromTo(elements,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, stagger, delay, ease: 'power2.out' }
    );
  },

  // Hover animations
  hoverScale: (element: Element, scale: number = 1.05) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(element, { scale, duration: 0.2, ease: 'power2.out' });
    return tl;
  },

  // Page transition
  pageTransition: (fromElement: Element, toElement: Element, duration: number = 0.5) => {
    const tl = gsap.timeline();
    tl.to(fromElement, { opacity: 0, duration: duration / 2, ease: 'power2.inOut' })
      .fromTo(toElement, { opacity: 0 }, { opacity: 1, duration: duration / 2, ease: 'power2.inOut' }, '-=0.25');
    return tl;
  },

  // Loading spinner
  spin: (element: Element, duration: number = 1) => {
    return gsap.to(element, { rotation: 360, duration, repeat: -1, ease: 'none' });
  },

  // Pulse effect
  pulse: (element: Element, duration: number = 2) => {
    return gsap.to(element, {
      scale: 1.1,
      duration: duration / 2,
      yoyo: true,
      repeat: -1,
      ease: 'power2.inOut'
    });
  }
};

// Hook for using GSAP animations in React components
export const useGsapAnimation = () => {
  return {
    ...animations,
    // Kill all animations on element
    killAnimations: (element: Element) => {
      gsap.killTweensOf(element);
    },

    // Get timeline for complex animations
    timeline: () => gsap.timeline(),

    // Set initial state without animation
    set: (element: Element, properties: Record<string, any>) => {
      gsap.set(element, properties);
    }
  };
};

export default animations;