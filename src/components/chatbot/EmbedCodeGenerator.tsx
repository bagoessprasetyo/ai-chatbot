// src/components/chatbot/EmbedCodeGenerator.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Copy, 
  Code, 
  Download, 
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface EmbedCodeGeneratorProps {
  chatbotId: string
  websiteId: string
  websiteUrl: string
  config?: any
}

export function EmbedCodeGenerator({ 
  chatbotId, 
  websiteId, 
  websiteUrl,
  config 
}: EmbedCodeGeneratorProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'

  const generateBasicEmbed = () => {
    return `<!-- WebBot AI Chatbot Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    script.setAttribute('data-website-id', '${websiteId}');
    script.defer = true;
    document.head.appendChild(script);
  })();
</script>`
  }

  const generateAdvancedEmbed = () => {
    return `<!-- WebBot AI Chatbot Widget - Advanced Configuration -->
<script>
  window.WebBotConfig = {
    chatbotId: '${chatbotId}',
    websiteId: '${websiteId}',
    position: '${config?.position || 'bottom-right'}',
    theme: '${config?.theme || 'default'}',
    primaryColor: '${config?.primary_color || '#3B82F6'}',
    welcomeMessage: '${config?.welcome_message || 'Hello! How can I help you today?'}',
    autoOpen: false,
    showBranding: ${config?.show_branding !== false},
    language: 'en'
  };
  
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.defer = true;
    document.head.appendChild(script);
  })();
</script>`
  }

  const generateWordPressPlugin = () => {
    return `<!-- For WordPress: Add this to your theme's functions.php file -->
<?php
function webbot_ai_widget() {
    ?>
    <script>
      (function() {
        var script = document.createElement('script');
        script.src = '${baseUrl}/widget.js';
        script.setAttribute('data-chatbot-id', '${chatbotId}');
        script.setAttribute('data-website-id', '${websiteId}');
        script.defer = true;
        document.head.appendChild(script);
      })();
    </script>
    <?php
}
add_action('wp_footer', 'webbot_ai_widget');
?>`
  }

  const generateReactComponent = () => {
    return `// React Component
import { useEffect } from 'react';

const WebBotWidget = () => {
  useEffect(() => {
    // Load WebBot AI widget
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    script.setAttribute('data-website-id', '${websiteId}');
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector(\`script[src="\${script.src}"]\`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // Widget renders itself
};

export default WebBotWidget;`
  }

  const generateNextJSComponent = () => {
    return `// Next.js Component (pages/_app.js or app/layout.js)
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        id="webbot-ai-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: \`
            (function() {
              var script = document.createElement('script');
              script.src = '${baseUrl}/widget.js';
              script.setAttribute('data-chatbot-id', '${chatbotId}');
              script.setAttribute('data-website-id', '${websiteId}');
              script.defer = true;
              document.head.appendChild(script);
            })();
          \`
        }}
      />
    </>
  );
}`
  }

  const generateGoogleTagManager = () => {
    return `<!-- Google Tag Manager Custom HTML Tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    script.setAttribute('data-website-id', '${websiteId}');
    script.defer = true;
    document.head.appendChild(script);
  })();
</script>

<!-- Configure this tag to fire on "All Pages" or specific page triggers -->`
  }

  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(type)
      toast.success(`${type} code copied to clipboard!`)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadAsFile = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`${filename} downloaded!`)
  }

  const CodeBlock = ({ 
    code, 
    language, 
    title, 
    description 
  }: { 
    code: string
    language: string
    title: string
    description: string
  }) => (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm text-green-400 bg-gray-900 rounded-lg">
          <code>{code}</code>
        </pre>
        
        <div className="absolute flex gap-2 top-2 right-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => copyToClipboard(code, title)}
            className="h-8"
          >
            {copiedCode === title ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadAsFile(code, `webbot-${language}.${language === 'html' ? 'html' : language === 'php' ? 'php' : 'js'}`)}
            className="h-8"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Embed Code Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Website Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div>
            <p className="font-medium">Target Website</p>
            <p className="text-sm text-muted-foreground">{websiteUrl}</p>
          </div>
          <Badge variant="outline">ID: {websiteId.slice(-8)}</Badge>
        </div>

        {/* Important Notice */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <strong>Important:</strong> Add this code to your website's HTML, preferably before the closing &lt;/body&gt; tag 
            or in your website's footer. The widget will automatically appear based on your configuration.
          </AlertDescription>
        </Alert>

        {/* Code Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <CodeBlock
              code={generateBasicEmbed()}
              language="html"
              title="Basic Embed"
              description="Simple installation - just copy and paste this code into your website's HTML"
            />

            <CodeBlock
              code={generateAdvancedEmbed()}
              language="html"
              title="Advanced Configuration"
              description="Includes custom configuration options for more control over the widget behavior"
            />
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            <CodeBlock
              code={generateWordPressPlugin()}
              language="php"
              title="WordPress"
              description="Add this code to your WordPress theme's functions.php file"
            />

            <CodeBlock
              code={generateGoogleTagManager()}
              language="html"
              title="Google Tag Manager"
              description="Create a Custom HTML tag in Google Tag Manager with this code"
            />

            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Shopify Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  Go to Online Store → Themes → Actions → Edit Code → theme.liquid, 
                  then paste the basic embed code before &lt;/body&gt;
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50">
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  <li>Copy the basic embed code above</li>
                  <li>Go to your Shopify admin panel</li>
                  <li>Navigate to Online Store → Themes</li>
                  <li>Click Actions → Edit Code</li>
                  <li>Find and open theme.liquid</li>
                  <li>Paste the code before &lt;/body&gt;</li>
                  <li>Save the file</li>
                </ol>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="frameworks" className="space-y-6">
            <CodeBlock
              code={generateReactComponent()}
              language="react"
              title="React Component"
              description="React component that loads the WebBot AI widget"
            />

            <CodeBlock
              code={generateNextJSComponent()}
              language="nextjs"
              title="Next.js Implementation"
              description="Add to your Next.js app using the Script component for optimal loading"
            />

            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Vue.js Implementation</h4>
                <p className="text-sm text-muted-foreground">Add the basic embed code to your index.html or use a mounted lifecycle hook</p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Angular Implementation</h4>
                <p className="text-sm text-muted-foreground">Add the basic embed code to your index.html or load it dynamically in a component</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Testing Instructions */}
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Testing:</strong> After adding the code to your website, visit your site to see the chatbot widget. 
            It may take a few minutes for changes to appear. You can test the widget functionality immediately.
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test on Live Site
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={() => copyToClipboard(generateBasicEmbed(), 'Basic Embed')}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Basic Code
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => downloadAsFile(generateBasicEmbed(), 'webbot-embed.html')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}