// public/chatbot-widget.js - Improved version
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
    iframe.src = `https://webbot-ai.netlify.app/widget?chatbotId=${encodeURIComponent(chatbotId)}&websiteId=${encodeURIComponent(websiteId)}`;
    iframe.title = 'WebBot AI Chat Widget';
    
    // Iframe styles - make it invisible initially
    iframe.style.cssText = `
      position: fixed !important;
      bottom: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      border: none !important;
      background: transparent !important;
      z-index: 999999 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    `;

    // Handle iframe load
    iframe.onload = function() {
      console.log('WebBot AI: Widget iframe loaded successfully');
      // Make iframe visible and enable pointer events
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = 'auto';
    };

    iframe.onerror = function() {
      console.error('WebBot AI: Failed to load widget iframe');
    };

    // Add iframe to document
    document.body.appendChild(iframe);

    // Handle responsive design
    function updateIframeSize() {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
      } else {
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
      }
    }

    window.addEventListener('resize', updateIframeSize);
    updateIframeSize();

    // Handle messages from iframe (for future features)
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== origin) {
        return;
      }

      // Handle different message types
      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'webbot-resize':
            // Handle dynamic resizing if needed
            console.log('WebBot AI: Resize request received');
            break;
          case 'webbot-ready':
            console.log('WebBot AI: Widget ready');
            break;
          case 'webbot-error':
            console.error('WebBot AI: Widget error', event.data.error);
            break;
          default:
            // Unknown message type
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

  // Add some basic CSS to ensure our widget doesn't interfere with the host site
  function addWidgetStyles() {
    if (document.getElementById('webbot-ai-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'webbot-ai-styles';
    style.textContent = `
      #webbot-ai-widget {
        /* Ensure our iframe is always on top and properly positioned */
        position: fixed !important;
        z-index: 999999 !important;
        border: none !important;
        background: transparent !important;
      }
      
      /* Prevent scroll issues on mobile */
      @media (max-width: 768px) {
        #webbot-ai-widget.mobile-fullscreen {
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
      }
      
      /* Ensure the widget doesn't interfere with host site styles */
      #webbot-ai-widget * {
        box-sizing: border-box;
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize
  addWidgetStyles();
  init();

  // Expose API for external control (optional)
  window.WebBotAI = {
    chatbotId: chatbotId,
    websiteId: websiteId,
    
    // Method to manually trigger widget reload
    reload: function() {
      console.log('WebBot AI: Reloading widget');
      const existingWidget = document.getElementById('webbot-ai-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      createWidget();
    },
    
    // Method to remove widget
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
    
    // Method to check if widget is loaded
    isLoaded: function() {
      return !!document.getElementById('webbot-ai-widget');
    },
    
    // Method to open/close widget programmatically
    toggle: function() {
      const iframe = document.getElementById('webbot-ai-widget');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'webbot-toggle' }, origin);
      }
    }
  };

  console.log('WebBot AI: Widget script initialized successfully');

})();