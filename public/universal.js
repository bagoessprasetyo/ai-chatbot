// public/universal.js - One-line widget loader
(function() {
    'use strict';
    
    // Prevent multiple loads
    if (window.WebBotUniversalLoaded) return;
    window.WebBotUniversalLoaded = true;
    
    // Configuration from script tag or global config
    const getCurrentScript = () => {
      return document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
    };
    
    const script = getCurrentScript();
    const config = window.WebBotConfig || {};
    
    // Extract config from script src or attributes
    const chatbotId = config.id || 
                     script.getAttribute('data-chatbot-id') || 
                     script.getAttribute('data-id') ||
                     extractIdFromSrc(script.src);
    
    const websiteId = config.websiteId || 
                     script.getAttribute('data-website-id') || 
                     script.getAttribute('data-website') ||
                     'auto';
    
    function extractIdFromSrc(src) {
      // Extract ID from URLs like: /widget/CHATBOT_ID.js
      const match = src.match(/\/widget\/([^\.\/]+)\.js$/);
      return match ? match[1] : null;
    }
    
    if (!chatbotId) {
      console.warn('WebBot: No chatbot ID found. Please specify data-chatbot-id attribute or window.WebBotConfig.id');
      return;
    }
    
    // Configuration options
    const options = {
      position: config.position || script.getAttribute('data-position') || 'bottom-right',
      theme: config.theme || script.getAttribute('data-theme') || 'default',
      autoOpen: config.autoOpen !== undefined ? config.autoOpen : 
                script.getAttribute('data-auto-open') === 'true',
      mode: config.mode || script.getAttribute('data-mode') || 'widget', // 'widget', 'iframe', 'popup'
      baseUrl: 'https://webbot-ai.netlify.app/'
    };
    
    // Create widget based on mode
    function createWidget() {
      switch (options.mode) {
        case 'iframe':
          createIframeWidget();
          break;
        case 'popup':
          createPopupWidget();
          break;
        case 'widget':
        default:
          createFloatingWidget();
          break;
      }
    }
    
    // Method 1: iframe widget (simplest, most compatible)
    function createIframeWidget() {
      const container = document.createElement('div');
      container.id = 'webbot-universal-container';
      
      const iframe = document.createElement('iframe');
      iframe.src = `${options.baseUrl}/embed/${chatbotId}?websiteId=${websiteId}&mode=widget`;
      iframe.style.cssText = getIframeStyles();
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.title = 'Chat Widget';
      
      container.appendChild(iframe);
      document.body.appendChild(container);
      
      // Auto-open if configured
      if (options.autoOpen) {
        setTimeout(() => {
          iframe.style.display = 'block';
        }, 1000);
      }
      
      // Add responsive handling
      handleResponsive(iframe);
    }
    
    // Method 2: Popup widget
    function createPopupWidget() {
      const button = document.createElement('button');
      button.innerHTML = '💬 Chat';
      button.style.cssText = getButtonStyles();
      button.onclick = () => {
        const popup = window.open(
          `${options.baseUrl}/chat/${chatbotId}?websiteId=${websiteId}`,
          'webbot-chat',
          'width=400,height=600,scrollbars=no,resizable=yes'
        );
        popup.focus();
      };
      
      document.body.appendChild(button);
    }
    
    // Method 3: Full widget (loads the React component)
    function createFloatingWidget() {
      // Load the full widget script
      const widgetScript = document.createElement('script');
      widgetScript.src = `${options.baseUrl}/chatbot-widget.js`;
      widgetScript.setAttribute('data-chatbot-id', chatbotId);
      widgetScript.setAttribute('data-website-id', websiteId);
      document.head.appendChild(widgetScript);
    }
    
    function getIframeStyles() {
      const baseStyles = `
        position: fixed !important;
        border: none !important;
        background: transparent !important;
        z-index: 999999 !important;
        transition: all 0.3s ease !important;
        border-radius: 16px !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
      `;
      
      const positionStyles = getPositionStyles();
      const sizeStyles = `
        width: 400px !important;
        height: 600px !important;
        max-width: calc(100vw - 40px) !important;
        max-height: calc(100vh - 40px) !important;
      `;
      
      return baseStyles + positionStyles + sizeStyles;
    }
    
    function getPositionStyles() {
      switch (options.position) {
        case 'bottom-left':
          return 'bottom: 20px !important; left: 20px !important;';
        case 'bottom-center':
          return 'bottom: 20px !important; left: 50% !important; transform: translateX(-50%) !important;';
        case 'top-right':
          return 'top: 20px !important; right: 20px !important;';
        case 'top-left':
          return 'top: 20px !important; left: 20px !important;';
        case 'bottom-right':
        default:
          return 'bottom: 20px !important; right: 20px !important;';
      }
    }
    
    function getButtonStyles() {
      const positionStyles = getPositionStyles();
      return `
        ${positionStyles}
        position: fixed !important;
        z-index: 999999 !important;
        background: #3B82F6 !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 25px !important;
        cursor: pointer !important;
        font-family: system-ui, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
        transition: all 0.2s ease !important;
      `;
    }
    
    function handleResponsive(iframe) {
      function updateSize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          iframe.style.width = 'calc(100vw - 20px) !important';
          iframe.style.height = 'calc(100vh - 20px) !important';
          iframe.style.bottom = '10px !important';
          iframe.style.right = '10px !important';
          iframe.style.left = '10px !important';
          iframe.style.borderRadius = '12px !important';
        } else {
          iframe.style.width = '400px !important';
          iframe.style.height = '600px !important';
          iframe.style.bottom = '20px !important';
          iframe.style.right = '20px !important';
          iframe.style.left = 'auto !important';
          iframe.style.borderRadius = '16px !important';
        }
      }
      
      window.addEventListener('resize', updateSize);
      updateSize();
    }
    
    // Initialize when DOM is ready
    function init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
      } else {
        createWidget();
      }
    }
    
    // Expose API
    window.WebBotUniversal = {
      chatbotId: chatbotId,
      websiteId: websiteId,
      options: options,
      
      open: function() {
        const iframe = document.querySelector('#webbot-universal-container iframe');
        if (iframe) iframe.style.display = 'block';
      },
      
      close: function() {
        const iframe = document.querySelector('#webbot-universal-container iframe');
        if (iframe) iframe.style.display = 'none';
      },
      
      toggle: function() {
        const iframe = document.querySelector('#webbot-universal-container iframe');
        if (iframe) {
          iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
        }
      },
      
      destroy: function() {
        const container = document.getElementById('webbot-universal-container');
        if (container) container.remove();
        window.WebBotUniversalLoaded = false;
      }
    };
    
    init();
    
  })();