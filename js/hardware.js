/**
 * RF1 — Hardware Adapter for Rabbit R1
 * Integrates with Rabbit R1 creations-sdk native hardware events:
 * - Scroll Wheel ('scrollUp', 'scrollDown')
 * - Side Button / PTT ('sideClick', 'longPressStart', 'longPressEnd')
 * - Desktop browser fallback (mouse wheel, keyboard arrows, 'P' key, Space)
 */

const RF1Hardware = {
  listeners: {
    scrollUp: [],
    scrollDown: [],
    sideClick: [],
    longPressStart: [],
    longPressEnd: []
  },

  isR1Hardware: false,

  init() {
    // Detect Rabbit R1 Creations environment
    this.isR1Hardware = typeof window.PluginMessageHandler !== 'undefined' || 
                        typeof window.creationStorage !== 'undefined';

    console.log(`[RF1Hardware] Initializing hardware bridge (R1 Hardware: ${this.isR1Hardware})`);

    // 1. Rabbit R1 Native Hardware Events
    window.addEventListener('scrollUp', () => this.trigger('scrollUp'));
    window.addEventListener('scrollDown', () => this.trigger('scrollDown'));
    window.addEventListener('sideClick', () => this.trigger('sideClick'));
    window.addEventListener('longPressStart', () => this.trigger('longPressStart'));
    window.addEventListener('longPressEnd', () => this.trigger('longPressEnd'));

    // 2. Desktop Browser Fallbacks
    window.addEventListener('wheel', (e) => {
      // Allow native scrolling inside the driver list if user is dragging/scrolling it
      const listContainer = e.target.closest('.tower-list-container');
      if (listContainer && listContainer.scrollHeight > listContainer.clientHeight) {
        return;
      }
      e.preventDefault();
      if (e.deltaY < 0) {
        this.trigger('scrollUp');
      } else if (e.deltaY > 0) {
        this.trigger('scrollDown');
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        this.trigger('scrollUp');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        this.trigger('scrollDown');
      } else if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.trigger('sideClick');
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        this.trigger('longPressStart');
      }
    });
  },

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  },

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[RF1Hardware] Error in ${event} callback:`, err);
        }
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.RF1Hardware = RF1Hardware;
}
