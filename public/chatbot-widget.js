// public/chatbot-widget.js
(function() {
  'use strict';

  // Prevent multiple instances
  if (window.WebBotAILoaded) {
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

  if (!chatbotId || !websiteId) {
    console.error('WebBot AI: Missing required attributes data-chatbot-id or data-website-id');
    return;
  }

  // Create widget container
  function createWidget() {
    // Check if widget already exists
    if (document.getElementById('webbot-ai-widget')) {
      return;
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'webbot-ai-widget';
    iframe.src = `${origin}/widget?chatbotId=${encodeURIComponent(chatbotId)}&websiteId=${encodeURIComponent(websiteId)}`;
    
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
      // Make iframe visible and enable pointer events
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = 'auto';
      
      console.log('WebBot AI: Widget loaded successfully');
    };

    iframe.onerror = function() {
      console.error('WebBot AI: Failed to load widget');
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
      switch (event.data.type) {
        case 'webbot-resize':
          // Handle dynamic resizing if needed
          break;
        case 'webbot-ready':
          console.log('WebBot AI: Widget ready');
          break;
        default:
          // Unknown message type
          break;
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
      const existingWidget = document.getElementById('webbot-ai-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      createWidget();
    },
    
    // Method to remove widget
    destroy: function() {
      const existingWidget = document.getElementById('webbot-ai-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      const existingStyles = document.getElementById('webbot-ai-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
      window.WebBotAILoaded = false;
    }
  };

})();