// src/app/page.tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container px-4 py-16 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
            AI Chatbots for 
            <span className="text-blue-600"> Any Website</span>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-600">
            Automatically create intelligent chatbots for your website using AI. 
            No coding required - just add your URL and deploy in minutes.
          </p>
          
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/login">
                Get Started Free
              </Link>
            </Button>
            
            <Button variant="outline" size="lg">
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid max-w-4xl gap-8 mx-auto mt-16 md:grid-cols-3">
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Auto Website Scraping</h3>
            <p className="text-gray-600">AI automatically reads and understands your website content</p>
          </div>
          
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Intelligent Responses</h3>
            <p className="text-gray-600">Context-aware answers based on your specific content</p>
          </div>
          
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Quick Deployment</h3>
            <p className="text-gray-600">Copy-paste embed code to go live in under 5 minutes</p>
          </div>
        </div>
      </div>
    </main>
  )
}