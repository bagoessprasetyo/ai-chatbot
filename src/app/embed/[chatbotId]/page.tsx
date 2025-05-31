// src/app/embed/[chatbotId]/page.tsx - Complete iframe embed with transparency fix
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import SubscriptionAwareChatWidget from '@/components/SubscriptionAwareChatWidget'

export default function EmbedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [isIframeMode, setIsIframeMode] = useState(false)
  const [transparencyMode, setTransparencyMode] = useState(false)
  
  const chatbotId = params.chatbotId as string
  const websiteId = searchParams.get('websiteId') || searchParams.get('w') || 'default'
  const mode = searchParams.get('mode') || 'widget'
  const transparent = searchParams.get('transparent') === 'true'
  const iframe = searchParams.get('iframe') === 'true'

  // Force transparency function
  const forceTransparency = useCallback(() => {
    console.log('WebBot Embed: Forcing transparency...')
    
    // Set data attributes for CSS targeting
    document.documentElement.setAttribute('data-iframe', 'true')
    document.documentElement.setAttribute('data-transparent', 'true')
    document.documentElement.setAttribute('data-embed-mode', mode)
    
    // Create and inject transparency CSS
    const existingStyle = document.getElementById('webbot-transparency-css')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    const style = document.createElement('style')
    style.id = 'webbot-transparency-css'
    style.textContent = `
      /* CRITICAL: Force transparency on all possible elements */
      *, *::before, *::after {
        background-color: transparent !important;
        background-image: none !important;
        background: transparent !important;
      }
      
      /* Only specific widget elements should have backgrounds */
      .chat-window,
      .floating-button,
      .message-bubble,
      .contact-form,
      .input-area,
      .header-section,
      .form-container,
      .card,
      .modal,
      .popup,
      .dropdown,
      .menu,
      .button,
      .input,
      .textarea,
      .select,
      [class*="bg-"],
      [class*="background"],
      [style*="background"] {
        background: white !important;
        background-color: white !important;
      }
      
      /* Force transparency on critical elements */
      html, 
      body, 
      #__next, 
      #__next > div,
      [data-reactroot],
      .next-root,
      .embed-container,
      .widget-container,
      .widget-wrapper {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
      }
      
      /* iframe mode specific styles */
      [data-iframe="true"] {
        background: transparent !important;
        background-color: transparent !important;
      }
      
      /* Widget positioning for iframe mode */
      [data-iframe="true"] .widget-container {
        position: relative !important;
        bottom: auto !important;
        right: auto !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Hide floating button in iframe mode, show chat directly */
      [data-iframe="true"] .floating-button {
        display: none !important;
      }
      
      /* Adjust chat window for iframe mode */
      [data-iframe="true"] .chat-window {
        position: relative !important;
        bottom: auto !important;
        right: auto !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 8px !important;
        box-shadow: none !important;
        margin: 0 !important;
        transform: none !important;
        max-width: none !important;
        max-height: none !important;
      }
      
      /* Responsive design for mobile */
      @media (max-width: 768px) {
        [data-iframe="true"] .chat-window {
          border-radius: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      }
      
      /* Remove any potential white spaces or borders */
      [data-iframe="true"] * {
        box-sizing: border-box !important;
      }
      
      /* Ensure proper scroll behavior */
      [data-iframe="true"] html,
      [data-iframe="true"] body {
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
      }
    `
    
    // Insert at the very beginning of head to ensure highest priority
    document.head.insertBefore(style, document.head.firstChild)
    
    // Also set inline styles as backup
    document.documentElement.style.background = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundImage = 'none'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
    
    document.body.style.background = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    document.body.style.backgroundImage = 'none'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    
    console.log('WebBot Embed: Transparency styles applied')
  }, [mode])

  // Detect iframe mode
  const detectIframeMode = useCallback(() => {
    try {
      const inIframe = window.self !== window.top
      const transparentMode = transparent || iframe || inIframe
      
      setIsIframeMode(inIframe)
      setTransparencyMode(transparentMode)
      
      console.log('WebBot Embed: Iframe detection', {
        inIframe,
        transparentMode,
        transparent,
        iframe,
        searchParams: Object.fromEntries(searchParams.entries())
      })
      
      return { inIframe, transparentMode }
    } catch (e) {
      // Probably in iframe (cross-origin)
      const transparentMode = transparent || iframe || true
      setIsIframeMode(true)
      setTransparencyMode(transparentMode)
      
      console.log('WebBot Embed: Cross-origin iframe detected')
      return { inIframe: true, transparentMode }
    }
  }, [transparent, iframe, searchParams])

  // Initialize transparency and iframe detection
  useEffect(() => {
    console.log('WebBot Embed: Initializing embed page', { chatbotId, websiteId, mode })
    
    const { inIframe, transparentMode } = detectIframeMode()
    
    // Apply transparency if needed
    if (transparentMode) {
      // Apply immediately
      forceTransparency()
      
      // Apply again after a short delay to catch any dynamic content
      setTimeout(forceTransparency, 100)
      setTimeout(forceTransparency, 500)
      setTimeout(forceTransparency, 1000)
    }
    
    setIsReady(true)
    
    // Monitor for any style changes that might break transparency
    if (transparentMode) {
      const observer = new MutationObserver((mutations) => {
        let needsReapply = false
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            const target = mutation.target as HTMLElement
            if (target.tagName === 'HTML' || target.tagName === 'BODY' || target.id === '__next') {
              const bgColor = getComputedStyle(target).backgroundColor
              if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                needsReapply = true
              }
            }
          }
        })
        
        if (needsReapply) {
          console.log('WebBot Embed: Reapplying transparency due to style changes')
          forceTransparency()
        }
      })
      
      observer.observe(document.documentElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style', 'class']
      })
      
      // Cleanup observer
      return () => observer.disconnect()
    }
  }, [detectIframeMode, forceTransparency])

  // Handle iframe communication
  useEffect(() => {
    if (!isIframeMode) return

    const handleMessage = (event: MessageEvent) => {
      // Only listen to messages from parent frame
      if (event.source !== window.parent) return
      
      console.log('WebBot Embed: Received message from parent', event.data)
      
      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'webbot-show':
            // Handle show command
            break
          case 'webbot-hide':
            // Handle hide command
            break
          case 'webbot-resize':
            // Handle resize command
            break
        }
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Send ready message to parent
    if (window.parent) {
      window.parent.postMessage({ 
        type: 'webbot-ready', 
        chatbotId,
        websiteId 
      }, '*')
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [isIframeMode, chatbotId, websiteId])

  // Custom embed styles
  const embedStyles: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    background: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative'
  }

  // Loading state
  if (!isReady || !chatbotId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: transparencyMode ? 'transparent' : 'white',
        backgroundColor: transparencyMode ? 'transparent' : 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: 0
      }}>
        <div style={{
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: transparencyMode ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#666',
          border: transparencyMode ? '1px solid #e5e5e5' : 'none'
        }}>
          {!chatbotId ? (
            <>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
              <div>Invalid chatbot ID</div>
            </>
          ) : (
            <>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #3B82F6', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px auto'
              }}></div>
              <div>Loading chat widget...</div>
            </>
          )}
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div 
      style={embedStyles}
      data-embed-mode={mode}
      data-iframe-mode={isIframeMode}
      data-transparent={transparencyMode}
    >
      <SubscriptionAwareChatWidget 
        chatbotId={chatbotId}
        websiteId={websiteId}
      />
      
      {/* Global styles for iframe embedding */}
      <style jsx global>{`
        /* CRITICAL: Reset all backgrounds to transparent */
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        html, body, #__next, #__next > div, [data-reactroot] {
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          overflow: hidden !important;
          height: 100% !important;
          width: 100% !important;
        }
        
        /* Remove any default Next.js or React backgrounds */
        body::before, body::after,
        html::before, html::after,
        #__next::before, #__next::after {
          display: none !important;
        }
        
        /* Ensure all containers are transparent except widget elements */
        .embed-container,
        .widget-wrapper,
        .widget-container:not(.chat-window):not(.floating-button) {
          background: transparent !important;
          background-color: transparent !important;
        }
        
        /* Force iframe mode behavior */
        [data-iframe-mode="true"] .floating-button {
          display: none !important;
        }
        
        [data-iframe-mode="true"] .chat-window {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          margin: 0 !important;
          bottom: auto !important;
          right: auto !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          [data-iframe-mode="true"] .chat-window {
            border-radius: 0 !important;
          }
        }
        
        /* Prevent any scrollbars */
        body, html {
          overflow: hidden !important;
        }
        
        /* Remove focus outlines that might show backgrounds */
        *:focus {
          outline: none !important;
        }
        
        /* Loading animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000000,
          maxWidth: '200px'
        }}>
          <div>Mode: {mode}</div>
          <div>iframe: {isIframeMode ? 'Yes' : 'No'}</div>
          <div>Transparent: {transparencyMode ? 'Yes' : 'No'}</div>
          <div>ChatbotId: {chatbotId.slice(-6)}</div>
        </div>
      )}
    </div>
  )
}