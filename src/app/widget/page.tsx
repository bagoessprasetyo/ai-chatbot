'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import SubscriptionAwareChatWidget from '@/components/SubscriptionAwareChatWidget'

function WidgetContent() {
  const searchParams = useSearchParams()
  const chatbotId = searchParams.get('chatbotId')
  const websiteId = searchParams.get('websiteId')

  if (!chatbotId || !websiteId) {
    return (
      <div className="fixed bottom-5 right-5 bg-red-500 text-white p-4 rounded-lg z-[999999]">
        Error: Missing chatbotId or websiteId parameters
      </div>
    )
  }

  return (
    <SubscriptionAwareChatWidget 
      chatbotId={chatbotId}
      websiteId={websiteId}
    />
  )
}

export default function WidgetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WidgetContent />
    </Suspense>
  )
}