window.app = {};
window.app.screen = {
  screen: {
    // Расшырения экранов
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    // Проверка на Touch
    isTouchDevice: () => {
      return (
        !!(
          typeof window !== 'undefined' &&
          ('ontouchstart' in window ||
            (window.DocumentTouch &&
              typeof document !== 'undefined' &&
              document instanceof window.DocumentTouch))
        ) ||
        !!(
          typeof navigator !== 'undefined' &&
          (navigator.maxTouchPoints || navigator.msMaxTouchPoints)
        )
      );
    },
  },
};
