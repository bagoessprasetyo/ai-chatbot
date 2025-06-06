// public/webbot.js - Enhanced Universal Widget Loader with Session Support
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
      if (!src) return null;
      
      // Extract ID from URLs like: /webbot.js?id=CHATBOT_ID or /widget/CHATBOT_ID.js
      try {
        const url = new URL(src);
        const urlParams = new URLSearchParams(url.search);
        if (urlParams.get('id')) return urlParams.get('id');
        
        const match = src.match(/\/widget\/([^\.\/]+)\.js$/);
        return match ? match[1] : null;
      } catch (e) {
        return null;
      }
    }
    
    if (!chatbotId) {
      console.warn('WebBot Universal: No chatbot ID found. Please specify data-chatbot-id attribute or window.WebBotConfig.id');
      return;
    }
    
    console.log('WebBot Universal: Initializing with chatbot ID:', chatbotId);
    
    // Configuration options
    const options = {
      position: config.position || script.getAttribute('data-position') || 'bottom-right',
      theme: config.theme || script.getAttribute('data-theme') || 'default',
      autoOpen: config.autoOpen !== undefined ? config.autoOpen : 
                script.getAttribute('data-auto-open') === 'true',
      mode: config.mode || script.getAttribute('data-mode') || 'iframe',
      baseUrl: config.baseUrl || 'https://webbot-ai.netlify.app',
      persistSession: config.persistSession !== false, // Default to true
      sessionTimeout: config.sessionTimeout || (30 * 24 * 60 * 60 * 1000) // 30 days default
    };
    
    console.log('WebBot Universal: Configuration:', options);
    
    // Session management utilities
    const SessionManager = {
      getSessionKey: () => `webbot_session_${chatbotId}_${websiteId}`,
      getContactKey: () => `webbot_contact_${chatbotId}_${websiteId}`,
      
      hasActiveSession: function() {
        if (!options.persistSession) return false;
        try {
          const sessionData = localStorage.getItem(this.getSessionKey());
          const contactData = localStorage.getItem(this.getContactKey());
          return !!(sessionData && contactData);
        } catch (e) {
          return false;
        }
      },
      
      getSessionAge: function() {
        if (!options.persistSession) return 0;
        try {
          const sessionData = localStorage.getItem(this.getSessionKey());
          if (sessionData) {
            const data = JSON.parse(sessionData);
            return Date.now() - (data.createdAt || 0);
          }
        } catch (e) {
          return 0;
        }
        return 0;
      },
      
      isSessionExpired: function() {
        return this.getSessionAge() > options.sessionTimeout;
      },
      
      clearExpiredSession: function() {
        if (this.isSessionExpired()) {
          this.clearSession();
          console.log('WebBot Universal: Cleared expired session');
        }
      },
      
      clearSession: function() {
        try {
          localStorage.removeItem(this.getSessionKey());
          localStorage.removeItem(this.getContactKey());
        } catch (e) {
          console.warn('WebBot Universal: Could not clear session from localStorage');
        }
      }
    };
    
    // Check for expired sessions on load
    SessionManager.clearExpiredSession();
    
    // Create widget based on mode
    function createWidget() {
      // Check if widget already exists
      if (document.getElementById('webbot-universal-container')) {
        console.log('WebBot Universal: Widget already exists');
        return;
      }
      
      switch (options.mode) {
        case 'popup':
          createPopupWidget();
          break;
        case 'widget':
          createFloatingWidget();
          break;
        case 'iframe':
        default:
          createIframeWidget();
          break;
      }
    }
    
    // Method 1: iframe widget (most compatible, transparent)
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
        height: 700px !important;
        max-width: calc(100vw - 40px) !important;
        max-height: calc(100vh - 40px) !important;
      `;
      
      const iframe = document.createElement('iframe');
      // Add session parameters to URL
      const sessionParams = new URLSearchParams({
        websiteId: websiteId,
        transparent: 'true',
        iframe: 'true',
        mode: 'widget',
        persistSession: options.persistSession.toString(),
        sessionTimeout: options.sessionTimeout.toString()
      });
      
      iframe.src = `${options.baseUrl}/embed/${chatbotId}?${sessionParams.toString()}`;
      iframe.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important;
        background-color: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        pointer-events: auto !important;
        opacity: 1 !important;
        outline: none !important;
      `;
      
      // Set transparency attributes
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('seamless', 'seamless');
      iframe.title = 'Chat Widget';
      
      // Handle iframe load
      iframe.onload = function() {
        console.log('WebBot Universal: iframe loaded successfully');
        iframe.style.background = 'transparent';
        iframe.style.backgroundColor = 'transparent';
        
        // Post message to iframe about session state
        if (SessionManager.hasActiveSession()) {
          iframe.contentWindow.postMessage({
            type: 'webbot-session-info',
            hasActiveSession: true,
            sessionAge: SessionManager.getSessionAge()
          }, '*');
        }
      };
      
      iframe.onerror = function() {
        console.error('WebBot Universal: Failed to load iframe');
      };
      
      container.appendChild(iframe);
      document.body.appendChild(container);
      
      // Listen for messages from iframe
      window.addEventListener('message', function(event) {
        if (event.origin !== new URL(options.baseUrl).origin) return;
        
        const data = event.data;
        if (data.type === 'webbot-session-ended') {
          SessionManager.clearSession();
          console.log('WebBot Universal: Session ended by user');
        } else if (data.type === 'webbot-session-created') {
          console.log('WebBot Universal: New session created');
        }
      });
      
      // Auto-open logic with session awareness
      if (options.autoOpen) {
        const hasSession = SessionManager.hasActiveSession();
        const delay = hasSession ? 500 : 1000; // Faster for returning users
        
        setTimeout(() => {
          container.style.display = 'block';
          console.log(`WebBot Universal: Auto-opened widget (${hasSession ? 'returning' : 'new'} user)`);
        }, delay);
      }
      
      // Add responsive handling
      handleResponsive(container, iframe);
      
      console.log('WebBot Universal: iframe widget created successfully');
    }
    
    // Method 2: Popup widget
    function createPopupWidget() {
      console.log('WebBot Universal: Creating popup widget');
      
      const hasSession = SessionManager.hasActiveSession();
      
      const button = document.createElement('button');
      button.innerHTML = hasSession ? '💬 Continue Chat' : '💬 Chat';
      button.style.cssText = getButtonStyles();
      button.onclick = () => {
        const sessionParams = new URLSearchParams({
          websiteId: websiteId,
          persistSession: options.persistSession.toString(),
          sessionTimeout: options.sessionTimeout.toString()
        });
        
        const popup = window.open(
          `${options.baseUrl}/chat/${chatbotId}?${sessionParams.toString()}`,
          'webbot-chat',
          'width=400,height=600,scrollbars=no,resizable=yes,location=no,menubar=no,toolbar=no'
        );
        if (popup) {
          popup.focus();
        } else {
          // Popup blocked, fallback to new tab
          window.open(`${options.baseUrl}/chat/${chatbotId}?${sessionParams.toString()}`, '_blank');
        }
      };
      
      // Add session indicator
      if (hasSession) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: #10B981;
          border-radius: 50%;
          border: 2px solid white;
        `;
        button.style.position = 'relative';
        button.appendChild(indicator);
      }
      
      document.body.appendChild(button);
      console.log('WebBot Universal: Popup button created');
    }
    
    // Method 3: Full widget (loads the React component)
    function createFloatingWidget() {
      console.log('WebBot Universal: Creating floating widget');
      
      // Load the full widget script with session parameters
      const widgetScript = document.createElement('script');
      widgetScript.src = `${options.baseUrl}/chatbot-widget.js`;
      widgetScript.setAttribute('data-chatbot-id', chatbotId);
      widgetScript.setAttribute('data-website-id', websiteId);
      widgetScript.setAttribute('data-persist-session', options.persistSession.toString());
      widgetScript.setAttribute('data-session-timeout', options.sessionTimeout.toString());
      
      widgetScript.onload = () => {
        console.log('WebBot Universal: Full widget script loaded');
        
        // Notify about session state
        if (window.WebBotWidget && SessionManager.hasActiveSession()) {
          window.WebBotWidget.setSessionInfo({
            hasActiveSession: true,
            sessionAge: SessionManager.getSessionAge()
          });
        }
      };
      
      widgetScript.onerror = () => {
        console.error('WebBot Universal: Failed to load full widget script, falling back to iframe');
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
      const hasSession = SessionManager.hasActiveSession();
      
      return `
        ${positionStyles}
        position: fixed !important;
        z-index: 999999 !important;
        background: ${hasSession ? '#10B981' : '#3B82F6'} !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 25px !important;
        cursor: pointer !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(${hasSession ? '16, 185, 129' : '59, 130, 246'}, 0.3) !important;
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
          if (iframe) iframe.style.borderRadius = '12px !important';
        } else {
          container.style.width = '400px !important';
          container.style.height = '600px !important';
          container.style.bottom = '20px !important';
          container.style.right = '20px !important';
          container.style.left = 'auto !important';
          container.style.top = 'auto !important';
          container.style.transform = 'none !important';
          if (iframe) iframe.style.borderRadius = '16px !important';
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
    
    // Enhanced API for external control
    window.WebBotUniversal = {
      chatbotId: chatbotId,
      websiteId: websiteId,
      options: options,
      SessionManager: SessionManager,
      
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
      
      // Session management methods
      hasActiveSession: function() {
        return SessionManager.hasActiveSession();
      },
      
      endSession: function() {
        SessionManager.clearSession();
        this.reload(); // Reload widget to reflect session state
        console.log('WebBot Universal: Session ended via API');
      },
      
      getSessionInfo: function() {
        return {
          hasActiveSession: SessionManager.hasActiveSession(),
          sessionAge: SessionManager.getSessionAge(),
          isExpired: SessionManager.isSessionExpired()
        };
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
    
    console.log('WebBot Universal: Initialized successfully with session support');
    
  })();