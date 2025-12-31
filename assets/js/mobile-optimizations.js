/* global window, document, navigator */

/**
 * Optimizaciones globales de compatibilidad móvil para PixelPlay
 * Se carga al final antes de otros scripts para mejorar rendimiento
 */

function initMobileOptimizations() {
  // Detectar características del dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  };

  // Marcar el HTML con atributos de dispositivo para CSS condicional
  if (isMobile) document.documentElement.setAttribute('data-device', 'mobile');
  if (isIOS) document.documentElement.setAttribute('data-ios', 'true');
  if (isTouchDevice()) document.documentElement.setAttribute('data-touch', 'true');

  // Detectar conexión lenta
  if (navigator.connection) {
    const connection = navigator.connection;
    const isSlowConnection = connection.saveData || 
                             connection.effectiveType === '2g' ||
                             connection.effectiveType === '3g';
    
    if (isSlowConnection) {
      document.documentElement.setAttribute('data-slow-connection', 'true');
      // Deshabilitar imágenes de fondo innecesarias
      document.querySelectorAll('[style*="background-image"]').forEach(el => {
        if (window.innerWidth < 768) {
          el.style.backgroundImage = 'none';
        }
      });
    }
  }

  // Mejoras de viewport
  fixViewportHeight();

  // Manejar teclado virtual
  handleVirtualKeyboard();

  // Optimizar imágenes
  optimizeImages();

  // Mejorar rendimiento de animaciones
  optimizeAnimations();

  // Detectar scroll durante carga
  detectScrollBehavior();
}

/**
 * Arreglar altura del viewport en iOS (100vh issue)
 */
function fixViewportHeight() {
  if (!(/iPad|iPhone|iPod/.test(navigator.userAgent))) return;

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH, { passive: true });
  window.addEventListener('orientationchange', setVH, { passive: true });
}

/**
 * Manejar teclado virtual que oculta contenido
 */
function handleVirtualKeyboard() {
  const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      document.body.classList.add('keyboard-visible');
      // Scroll al input para que sea visible
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });

    input.addEventListener('blur', () => {
      document.body.classList.remove('keyboard-visible');
    });
  });
}

/**
 * Optimizar carga de imágenes con lazy loading
 */
function optimizeImages() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    // Agregar lazy loading nativo si no existe
    if (!img.loading) {
      img.loading = 'lazy';
    }

    // Srcset para diferentes resoluciones
    if (img.src && !img.srcset && window.innerWidth < 768) {
      // Reducir tamaño de imagen en móvil si es posible
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    }

    // Error handling para imágenes
    img.addEventListener('error', function() {
      this.style.display = 'none';
    });

    // Mejorar rendimiento de images con placeholder
    if (!img.src && img.dataset.src) {
      img.src = img.dataset.src;
    }
  });

  // Usar Intersection Observer para lazy loading más eficiente
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Reducir animaciones en conexiones lentas o preferencia de usuario
 */
function optimizeAnimations() {
  // Respetar preferencia de movimiento reducido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('*').forEach(el => {
      el.style.animationDuration = '0.01ms !important';
      el.style.transitionDuration = '0.01ms !important';
    });
  }

  // Deshabilitar algunas animaciones en conexiones lentas
  if (navigator.connection?.effectiveType === '2g') {
    document.querySelectorAll('*').forEach(el => {
      el.style.animation = 'none';
    });
  }
}

/**
 * Detectar comportamiento de scroll para optimizar
 */
function detectScrollBehavior() {
  let isScrolling = false;
  let scrollTimeout;

  document.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      document.documentElement.setAttribute('data-is-scrolling', 'true');
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document.documentElement.removeAttribute('data-is-scrolling');
    }, 150);
  }, { passive: true });
}

/**
 * Mejorar rendimiento de transiciones táctiles
 */
function setupTouchOptimizations() {
  // GPU acceleration para elementos táctiles
  const touchElements = document.querySelectorAll('button, a, [role="button"], article');
  touchElements.forEach(el => {
    el.style.willChange = 'transform, opacity';
    
    el.addEventListener('touchstart', () => {
      el.style.transform = 'scale(0.98)';
    }, { passive: true });

    el.addEventListener('touchend', () => {
      el.style.transform = 'scale(1)';
    }, { passive: true });
  });
}

/**
 * Detener animaciones pesadas cuando está fuera de vista
 */
function optimizeBackgroundAnimations() {
  if ('IntersectionObserver' in window) {
    const animatedElements = document.querySelectorAll('[class*="animate"]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        } else {
          entry.target.style.animationPlayState = 'paused';
        }
      });
    });

    animatedElements.forEach(el => observer.observe(el));
  }
}

/**
 * Desactivar hover states en dispositivos sin hover
 */
function handleHoverStates() {
  if (!window.matchMedia('(hover: hover)').matches) {
    // Dispositivo sin hover (móvil)
    const styles = document.createElement('style');
    styles.textContent = `
      *:hover { 
        background-color: inherit !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(styles);
  }
}

// Ejecutar inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initMobileOptimizations();
    setupTouchOptimizations();
    optimizeBackgroundAnimations();
    handleHoverStates();
  });
} else {
  initMobileOptimizations();
  setupTouchOptimizations();
  optimizeBackgroundAnimations();
  handleHoverStates();
}
