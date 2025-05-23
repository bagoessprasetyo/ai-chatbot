// src/app/test-widget/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

interface Website {
  id: string
  title: string
  url: string
  status: string
}

interface Chatbot {
  id: string
  name: string
  website_id: string
  is_active: boolean
}

export default function WidgetTestPage() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState<Website[]>([])
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>('')
  const [selectedChatbot, setSelectedChatbot] = useState<string>('')
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Fetch websites
        const { data: websitesData } = await supabase
          .from('websites')
          .select('id, title, url, status')
          .eq('status', 'ready')
          .order('created_at', { ascending: false })

        // Fetch chatbots
        const { data: chatbotsData } = await supabase
          .from('chatbots')
          .select('id, name, website_id, is_active')
          .eq('is_active', true)

        setWebsites(websitesData || [])
        setChatbots(chatbotsData || [])

        // Auto-select first available chatbot
        if (chatbotsData && chatbotsData.length > 0) {
          const firstChatbot = chatbotsData[0]
          setSelectedChatbot(firstChatbot.id)
          setSelectedWebsite(firstChatbot.website_id)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const loadWidget = () => {
    if (!selectedChatbot || !selectedWebsite) {
      alert('Please select a chatbot first')
      return
    }

    // Remove existing widget if any
    const existingScript = document.getElementById('webbot-widget-script')
    if (existingScript) {
      existingScript.remove()
    }

    const existingWidget = document.getElementById('webbot-ai-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    // Load the widget script
    const script = document.createElement('script')
    script.id = 'webbot-widget-script'
    script.src = '/chatbot-widget.js'
    script.setAttribute('data-chatbot-id', selectedChatbot)
    script.setAttribute('data-website-id', selectedWebsite)
    script.setAttribute('data-origin', window.location.origin)
    
    script.onload = () => {
      setIsWidgetLoaded(true)
      console.log('Widget script loaded')
    }

    script.onerror = () => {
      console.error('Failed to load widget script')
    }

    document.head.appendChild(script)
  }

  const removeWidget = () => {
    // Remove widget script
    const existingScript = document.getElementById('webbot-widget-script')
    if (existingScript) {
      existingScript.remove()
    }

    // Use the global API to destroy the widget
    if (window.WebBotAI) {
      window.WebBotAI.destroy()
    }

    setIsWidgetLoaded(false)
  }

  const getEmbedCode = () => {
    if (!selectedChatbot || !selectedWebsite) return ''

    return `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${window.location.origin}/chatbot-widget.js';
  script.setAttribute('data-chatbot-id', '${selectedChatbot}');
  script.setAttribute('data-website-id', '${selectedWebsite}');
  document.head.appendChild(script);
})();
</script>`
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode())
    alert('Embed code copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="container p-6 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Widget Testing</h1>
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container p-6 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Widget Testing</h1>
        <div>Please sign in to test widgets.</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Chatbot Widget Testing</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Widget Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Your Chatbot Widget</CardTitle>
            <CardDescription>
              Select a chatbot and test it on this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Website Selection */}
            <div>
              <Label>Website</Label>
              <select 
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md"
              >
                <option value="">Select a website</option>
                {websites.map(website => (
                  <option key={website.id} value={website.id}>
                    {website.title} - {website.url}
                  </option>
                ))}
              </select>
            </div>

            {/* Chatbot Selection */}
            <div>
              <Label>Chatbot</Label>
              <select 
                value={selectedChatbot}
                onChange={(e) => {
                  setSelectedChatbot(e.target.value)
                  const chatbot = chatbots.find(c => c.id === e.target.value)
                  if (chatbot) {
                    setSelectedWebsite(chatbot.website_id)
                  }
                }}
                className="w-full p-2 mt-1 border rounded-md"
              >
                <option value="">Select a chatbot</option>
                {chatbots.map(chatbot => (
                  <option key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Badge variant={isWidgetLoaded ? "default" : "secondary"}>
                {isWidgetLoaded ? "Widget Loaded" : "No Widget"}
              </Badge>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button 
                onClick={loadWidget}
                disabled={!selectedChatbot || !selectedWebsite}
                className="flex-1"
              >
                Load Widget
              </Button>
              <Button 
                onClick={removeWidget}
                variant="outline"
                disabled={!isWidgetLoaded}
                className="flex-1"
              >
                Remove Widget
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Embed Code */}
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>
              Copy this code to add the chatbot to any website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Embed Code</Label>
              <textarea
                readOnly
                value={getEmbedCode()}
                className="w-full h-32 p-2 mt-1 font-mono text-sm border rounded-md resize-none"
                placeholder="Select a chatbot to generate embed code"
              />
            </div>
            <Button 
              onClick={copyEmbedCode}
              disabled={!selectedChatbot}
              className="w-full"
            >
              Copy Embed Code
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Testing Steps:</h4>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Select a website with status ready (has scraped content)</li>
                <li>Select the corresponding chatbot</li>
                <li>Click Load Widget to test the chatbot on this page</li>
                <li>The chatbot will appear in the bottom-right corner</li>
                <li>Test sending messages to see if it responds with relevant content</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Deployment:</h4>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Copy the embed code above</li>
                <li>Paste it into your websites HTML, before the closing &lt;/body&gt; tag</li>
                <li>The chatbot will automatically load on your website</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Add type declaration for global WebBotAI
declare global {
  interface Window {
    WebBotAI?: {
      chatbotId: string
      websiteId: string
      reload: () => void
      destroy: () => void
    }
  }
}