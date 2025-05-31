// src/app/embed/[chatbotId]/page.tsx - SAFE version with no cross-origin issues
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import SubscriptionAwareChatWidget from '@/components/SubscriptionAwareChatWidget'

export default function EmbedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  
  const chatbotId = params.chatbotId as string
  const websiteId = searchParams.get('websiteId') || searchParams.get('w') || 'default'
  const transparent = searchParams.get('transparent') === 'true'
  const iframe = searchParams.get('iframe') === 'true'
  
  // Simple iframe detection without cross-origin risks
  const isIframe = transparent || iframe

  useEffect(() => {
    console.log('WebBot Embed: Initializing', { chatbotId, websiteId, isIframe })
    
    // Apply transparency styles immediately if needed
    if (isIframe) {
      // Set data attributes
      document.documentElement.setAttribute('data-iframe', 'true')
      document.documentElement.setAttribute('data-transparent', 'true')
      
      // Force transparency styles
      const style = document.createElement('style')
      style.id = 'webbot-transparency'
      style.textContent = `
        /* Make iframe container transparent, but keep widget normal */
        html, body, #__next, #__next > div {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        
        /* iframe-specific widget behavior */
        .floating-button {
          display: none !important;
        }
        
        /* Keep the chat widget with normal styling, just position it properly */
        .chat-window {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          bottom: auto !important;
          right: auto !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          margin: 0 !important;
          background: white !important;
          background-color: white !important;
        }
        
        @media (max-width: 768px) {
          .chat-window {
            border-radius: 0 !important;
          }
        }
      `
      
      document.head.appendChild(style)
      
      // Set body styles directly
      document.body.style.background = 'transparent'
      document.body.style.backgroundColor = 'transparent'
      document.body.style.margin = '0'
      document.body.style.padding = '0'
      document.body.style.overflow = 'hidden'
      
      console.log('WebBot Embed: Transparency applied')
    }
    
    setIsReady(true)
  }, [isIframe, chatbotId, websiteId])

  if (!isReady || !chatbotId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: isIframe ? 'transparent' : 'white',
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: isIframe ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#666',
          border: isIframe ? '1px solid #e5e5e5' : 'none'
        }}>
          {!chatbotId ? (
            <>⚠️<br/>Invalid chatbot ID</>
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
              Loading chat widget...
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      background: isIframe ? 'transparent' : 'white',
      overflow: 'hidden'
    }}>
      <SubscriptionAwareChatWidget 
        chatbotId={chatbotId}
        websiteId={websiteId}
      />
      
      {/* Global transparency styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        html, body, #__next {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          ${isIframe ? `
            background: transparent !important;
            background-color: transparent !important;
          ` : ''}
        }
        
        ${isIframe ? `
          .floating-button {
            display: none !important;
          }
          
          .chat-window {
            position: relative !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            margin: 0 !important;
            bottom: auto !important;
            right: auto !important;
            transform: none !important;
          }
          
          @media (max-width: 768px) {
            .chat-window {
              border-radius: 0 !important;
            }
          }
        ` : ''}
      `}</style>
    </div>
  )
}