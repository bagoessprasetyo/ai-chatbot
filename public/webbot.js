// public/universal.js - Universal Widget Loader with Transparency Fix
(function() {
    'use strict';
    
    // Prevent multiple loads
    if (window.WebBotUniversalLoaded) {
      console.log('WebBot Universal: Already loaded');
      return;
    }
    window.WebBotUniversalLoaded = true;
    
    // Get the script element that loaded this file
    const getCurrentScript = () => {
      return document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
    };
    
    const script = getCurrentScript();
    const config = window.WebBotConfig || {};
    
    // Extract configuration from script src or attributes
    const chatbotId = config.id || 
                     script.getAttribute('data-chatbot-id') || 
                     script.getAttribute('data-id') ||
                     extractIdFromSrc(script.src);
    
    const websiteId = config.websiteId || 
                     script.getAttribute('data-website-id') || 
                     script.getAttribute('data-website') ||
                     'auto';
    
    function extractIdFromSrc(src) {
      // Extract ID from URLs like: /universal.js?id=CHATBOT_ID or /widget/CHATBOT_ID.js
      const urlParams = new URLSearchParams(src.split('?')[1]);
      if (urlParams.get('id')) return urlParams.get('id');
      
      const match = src.match(/\/widget\/([^\.\/]+)\.js$/);
      return match ? match[1] : null;
    }
    
    if (!chatbotId) {
      console.warn('WebBot Universal: No chatbot ID found. Please specify data-chatbot-id attribute or window.WebBotConfig.id');
      return;
    }
    
    console.log('WebBot Universal: Initializing with ID:', chatbotId);
    
    // Configuration options
    const options = {
      position: config.position || script.getAttribute('data-position') || 'bottom-right',
      theme: config.theme || script.getAttribute('data-theme') || 'default',
      autoOpen: config.autoOpen !== undefined ? config.autoOpen : 
                script.getAttribute('data-auto-open') === 'true',
      mode: config.mode || script.getAttribute('data-mode') || 'widget', // 'widget', 'iframe', 'popup'
      baseUrl: 'https://webbot-ai.netlify.app/'
    };
    
    console.log('WebBot Universal: Configuration:', options);
    
    // Create widget based on mode
    function createWidget() {
      // Check if widget already exists
      if (document.getElementById('webbot-universal-container')) {
        console.log('WebBot Universal: Widget already exists');
        return;
      }
      
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
    
    // Method 1: iframe widget (simplest, most compatible) - WITH TRANSPARENCY FIX
    function createIframeWidget() {
      console.log('WebBot Universal: Creating iframe widget');
      
      const container = document.createElement('div');
      container.id = 'webbot-universal-container';
      container.style.cssText = `
        position: fixed !important;
        background: transparent !important;
        background-color: transparent !important;
        pointer-events: none !important;
        z-index: 999999 !important;
        ${getPositionStyles()}
        width: 400px !important;
        height: 600px !important;
        max-width: calc(100vw - 40px) !important;
        max-height: calc(100vh - 40px) !important;
      `;
      
      const iframe = document.createElement('iframe');
      // KEY FIX: Add transparency parameters to URL
      
      iframe.src = `${options.baseUrl}/embed/${chatbotId}?websiteId=${websiteId}&mode=widget&transparent=true&iframe=true`;
      iframe.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important;
        background-color: transparent !important;
        border-radius: 16px !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
        pointer-events: auto !important;
        opacity: 1 !important;
        outline: none !important;
      `;
      
      // TRANSPARENCY FIX: Set all necessary attributes
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('seamless', 'seamless');
      iframe.setAttribute('allowfullscreen', 'false');
      iframe.title = 'Chat Widget';
      
      // Handle iframe load to ensure transparency
      iframe.onload = function() {
        console.log('WebBot Universal: iframe loaded successfully');
        try {
          // Additional transparency enforcement
          iframe.style.background = 'transparent';
          iframe.style.backgroundColor = 'transparent';
          
          // Try to access iframe content if same-origin (will fail for cross-origin, which is fine)
          if (iframe.contentDocument) {
            const iframeDoc = iframe.contentDocument;
            iframeDoc.documentElement.style.background = 'transparent';
            iframeDoc.body.style.background = 'transparent';
          }
        } catch (e) {
          // Cross-origin, but that's expected and fine
          console.log('WebBot Universal: Cross-origin iframe (expected)');
        }
      };
      
      iframe.onerror = function() {
        console.error('WebBot Universal: Failed to load iframe');
      };
      
      container.appendChild(iframe);
      document.body.appendChild(container);
      
      // Auto-open if configured
      if (options.autoOpen) {
        setTimeout(() => {
          container.style.display = 'block';
          console.log('WebBot Universal: Auto-opened widget');
        }, 1000);
      }
      
      // Add responsive handling
      handleResponsive(container, iframe);
      
      console.log('WebBot Universal: iframe widget created successfully');
    }
    
    // Method 2: Popup widget
    function createPopupWidget() {
      console.log('WebBot Universal: Creating popup widget');
      
      const button = document.createElement('button');
      button.innerHTML = '💬 Chat';
      button.style.cssText = getButtonStyles();
      button.onclick = () => {
        const popup = window.open(
          `${options.baseUrl}/chat/${chatbotId}?websiteId=${websiteId}`,
          'webbot-chat',
          'width=400,height=600,scrollbars=no,resizable=yes,location=no,menubar=no,toolbar=no'
        );
        if (popup) {
          popup.focus();
        } else {
          // Popup blocked, fallback to new tab
          window.open(`${options.baseUrl}/chat/${chatbotId}?websiteId=${websiteId}`, '_blank');
        }
      };
      
      document.body.appendChild(button);
      console.log('WebBot Universal: Popup button created');
    }
    
    // Method 3: Full widget (loads the React component)
    function createFloatingWidget() {
      console.log('WebBot Universal: Creating floating widget');
      
      // Load the full widget script
      const widgetScript = document.createElement('script');
      widgetScript.src = `${options.baseUrl}/chatbot-widget.js`;
      widgetScript.setAttribute('data-chatbot-id', chatbotId);
      widgetScript.setAttribute('data-website-id', websiteId);
      widgetScript.onload = () => {
        console.log('WebBot Universal: Full widget script loaded');
      };
      widgetScript.onerror = () => {
        console.error('WebBot Universal: Failed to load full widget script');
        // Fallback to iframe mode
        options.mode = 'iframe';
        createIframeWidget();
      };
      document.head.appendChild(widgetScript);
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
        case 'center':
          return 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;';
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
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
        transition: all 0.2s ease !important;
        outline: none !important;
      `;
    }
    
    function handleResponsive(container, iframe) {
      function updateSize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          container.style.width = 'calc(100vw - 20px) !important';
          container.style.height = 'calc(100vh - 20px) !important';
          container.style.bottom = '10px !important';
          container.style.right = '10px !important';
          container.style.left = '10px !important';
          container.style.top = 'auto !important';
          container.style.transform = 'none !important';
          iframe.style.borderRadius = '12px !important';
        } else {
          container.style.width = '400px !important';
          container.style.height = '600px !important';
          container.style.bottom = '20px !important';
          container.style.right = '20px !important';
          container.style.left = 'auto !important';
          container.style.top = 'auto !important';
          container.style.transform = 'none !important';
          iframe.style.borderRadius = '16px !important';
        }
      }
      
      window.addEventListener('resize', updateSize);
      updateSize();
    }
    
    // Initialize widget when DOM is ready
    function init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
      } else {
        createWidget();
      }
    }
    
    // Expose API for external control
    window.WebBotUniversal = {
      chatbotId: chatbotId,
      websiteId: websiteId,
      options: options,
      
      // Show the widget
      open: function() {
        const container = document.getElementById('webbot-universal-container');
        if (container) {
          container.style.display = 'block';
          console.log('WebBot Universal: Widget opened');
        }
      },
      
      // Hide the widget
      close: function() {
        const container = document.getElementById('webbot-universal-container');
        if (container) {
          container.style.display = 'none';
          console.log('WebBot Universal: Widget closed');
        }
      },
      
      // Toggle widget visibility
      toggle: function() {
        const container = document.getElementById('webbot-universal-container');
        if (container) {
          const isVisible = container.style.display !== 'none';
          container.style.display = isVisible ? 'none' : 'block';
          console.log('WebBot Universal: Widget toggled to', isVisible ? 'closed' : 'open');
        }
      },
      
      // Remove widget completely
      destroy: function() {
        const container = document.getElementById('webbot-universal-container');
        if (container) {
          container.remove();
          console.log('WebBot Universal: Widget destroyed');
        }
        window.WebBotUniversalLoaded = false;
      },
      
      // Check if widget is loaded
      isLoaded: function() {
        return !!document.getElementById('webbot-universal-container');
      },
      
      // Reload widget with new options
      reload: function(newOptions = {}) {
        this.destroy();
        Object.assign(options, newOptions);
        setTimeout(createWidget, 100);
      },
      
      // Get current configuration
      getConfig: function() {
        return { ...options, chatbotId, websiteId };
      }
    };
    
    // Initialize
    init();
    
    console.log('WebBot Universal: Initialized successfully');
    
  })();