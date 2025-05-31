// public/chatbot-widget.js - Fixed version
(function() {
  'use strict';

  // Prevent multiple instances
  if (window.WebBotAILoaded) {
    console.log('WebBot AI: Widget already loaded');
    return;
  }
  window.WebBotAILoaded = true;

  // Get the script element that loaded this file
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  // Extract configuration from script attributes
  const chatbotId = currentScript.getAttribute('data-chatbot-id');
  const websiteId = currentScript.getAttribute('data-website-id');
  const origin = currentScript.getAttribute('data-origin') || window.location.origin;

  console.log('WebBot AI: Initializing widget', { chatbotId, websiteId, origin });

  if (!chatbotId || !websiteId) {
    console.error('WebBot AI: Missing required attributes data-chatbot-id or data-website-id');
    return;
  }

  // Create widget container
  function createWidget() {
    // Check if widget already exists
    if (document.getElementById('webbot-ai-widget')) {
      console.log('WebBot AI: Widget already exists');
      return;
    }

    console.log('WebBot AI: Creating widget iframe');

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'webbot-ai-widget';
    iframe.src = `http://localhost:3000/widget?chatbotId=${encodeURIComponent(chatbotId)}&websiteId=${encodeURIComponent(websiteId)}`;
    iframe.title = 'WebBot AI Chat Widget';
    
    // Fixed iframe styles - proper floating widget dimensions
    iframe.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 400px !important;
      height: 600px !important;
      max-width: calc(100vw - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      border: none !important;
      background: transparent !important;
      z-index: 999999 !important;
      border-radius: 16px !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    `;

    // Handle iframe load
    iframe.onload = function() {
      console.log('WebBot AI: Widget iframe loaded successfully');
      // Make iframe visible
      iframe.style.opacity = '1';
    };

    iframe.onerror = function() {
      console.error('WebBot AI: Failed to load widget iframe');
    };
    iframe.setAttribute('allowtransparency', 'true'); // Some browsers respect this
    // Add iframe to document
    document.body.appendChild(iframe);

    // Handle responsive design
    function updateIframeSize() {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        iframe.style.width = 'calc(100vw - 20px)';
        iframe.style.height = 'calc(100vh - 20px)';
        iframe.style.bottom = '10px';
        iframe.style.right = '10px';
      } else {
        iframe.style.width = '400px';
        iframe.style.height = '600px';
        iframe.style.bottom = '20px';
        iframe.style.right = '20px';
      }
    }

    window.addEventListener('resize', updateIframeSize);
    updateIframeSize();

    // Handle messages from iframe
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== 'http://localhost:3000') {
        return;
      }

      // Handle different message types
      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'webbot-resize':
            console.log('WebBot AI: Resize request received');
            break;
          case 'webbot-ready':
            console.log('WebBot AI: Widget ready');
            break;
          case 'webbot-error':
            console.error('WebBot AI: Widget error', event.data.error);
            break;
          case 'webbot-minimize':
            // Handle minimize state
            iframe.style.width = '80px';
            iframe.style.height = '80px';
            break;
          case 'webbot-restore':
            // Restore to full size
            updateIframeSize();
            break;
          default:
            break;
        }
      }
    });

    return iframe;
  }

  // Initialize widget when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createWidget);
    } else {
      createWidget();
    }
  }

  // Add widget styles
  function addWidgetStyles() {
    if (document.getElementById('webbot-ai-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'webbot-ai-styles';
    style.textContent = `
      #webbot-ai-widget {
        /* Ensure proper stacking and positioning */
        position: fixed !important;
        z-index: 999999 !important;
        border: none !important;
        background: transparent !important;
        pointer-events: auto !important;
      }
      
      /* Ensure the widget doesn't interfere with host site */
      #webbot-ai-widget * {
        box-sizing: border-box;
      }
      
      /* Prevent any host site styles from affecting the widget */
      #webbot-ai-widget {
        all: initial;
        position: fixed !important;
        z-index: 999999 !important;
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize
  addWidgetStyles();
  init();

  // Expose API for external control
  window.WebBotAI = {
    chatbotId: chatbotId,
    websiteId: websiteId,
    
    reload: function() {
      console.log('WebBot AI: Reloading widget');
      const existingWidget = document.getElementById('webbot-ai-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      createWidget();
    },
    
    destroy: function() {
      console.log('WebBot AI: Destroying widget');
      const existingWidget = document.getElementById('webbot-ai-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      const existingStyles = document.getElementById('webbot-ai-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
      window.WebBotAILoaded = false;
    },
    
    isLoaded: function() {
      return !!document.getElementById('webbot-ai-widget');
    },
    
    toggle: function() {
      const iframe = document.getElementById('webbot-ai-widget');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'webbot-toggle' }, 'http://localhost:3000');
      }
    }
  };

  console.log('WebBot AI: Widget script initialized successfully');

})();