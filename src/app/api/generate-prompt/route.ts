/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/generate-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

interface GeneratePromptRequest {
  websiteId: string
}

interface ScrapedContent {
  pages: Array<{
    url: string
    title: string
    content: string
    description?: string
    keywords?: string[]
  }>
  totalPages: number
  mainContent: string
  titles: string[]
  descriptions: string[]
  keywords: string[]
}

// Generate system prompt from scraped content
function generateSystemPrompt(content: ScrapedContent, websiteUrl: string, websiteTitle: string): string {
  // Extract key information
  const businessName = websiteTitle || 'this website'
  const mainTopics = extractMainTopics(content.mainContent)
  const services = extractServices(content.mainContent)
  const contactInfo = extractContactInfo(content.mainContent)
  
  // Create comprehensive system prompt
  const systemPrompt = `You are an AI customer service assistant for ${businessName}. Your role is to help visitors by answering questions about the business, its products/services, and providing helpful information based on the website content.

WEBSITE INFORMATION:
- Business: ${businessName}
- Website: ${websiteUrl}
- Pages analyzed: ${content.totalPages}

KEY TOPICS AND SERVICES:
${mainTopics.length > 0 ? mainTopics.map(topic => `- ${topic}`).join('\n') : '- General business information'}

${services.length > 0 ? `
MAIN SERVICES/PRODUCTS:
${services.map(service => `- ${service}`).join('\n')}
` : ''}

${contactInfo ? `
CONTACT INFORMATION:
${contactInfo}
` : ''}

CONTENT KNOWLEDGE BASE:
${content.mainContent.substring(0, 8000)} ${content.mainContent.length > 8000 ? '...' : ''}

INSTRUCTIONS:
1. Always be helpful, professional, and friendly
2. Answer questions based on the website content provided above
3. If asked about something not covered in the content, politely say you don't have that specific information and suggest contacting the business directly
4. Don't make up information that isn't in the website content
5. Keep responses concise but informative
6. If appropriate, guide users toward contacting the business or taking relevant actions
7. Use a conversational tone that matches the business's style
8. If asked about pricing, hours, or specific policies not mentioned in the content, direct users to contact the business

RESPONSE STYLE:
- Use a warm, professional tone
- Keep responses under 200 words when possible
- Use bullet points or numbered lists for complex information
- Include relevant links to website pages when helpful
- End with a question or call-to-action when appropriate

Remember: You represent ${businessName} and should always aim to be helpful while staying within the bounds of the information provided.`

  return systemPrompt
}

// Extract main topics from content
function extractMainTopics(content: string): string[] {
//   const topics = new Set<string>()
  const words = content.toLowerCase().split(/\s+/)
  
  // Common business-related keywords to look for
  const businessKeywords = [
    'services', 'products', 'solutions', 'consulting', 'support',
    'development', 'design', 'marketing', 'sales', 'training',
    'software', 'technology', 'business', 'company', 'team',
    'experience', 'expertise', 'professional', 'quality'
  ]
  
  // Find repeated important terms
  const wordCounts = new Map<string, number>()
  words.forEach(word => {
    if (word.length > 4 && businessKeywords.includes(word)) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    }
  })
  
  // Get top topics
  const sortedWords = Array.from(wordCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
  
  return sortedWords
}

// Extract services/products mentioned
function extractServices(content: string): string[] {
  const services = new Set<string>()
  
  // Look for common service patterns
  const servicePatterns = [
    /we offer (.*?)(?:\.|,|$)/gi,
    /our services include (.*?)(?:\.|,|$)/gi,
    /we provide (.*?)(?:\.|,|$)/gi,
    /services:\s*(.*?)(?:\n|$)/gi,
    /products:\s*(.*?)(?:\n|$)/gi
  ]
  
  servicePatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const service = match.replace(pattern, '$1').trim()
        if (service.length > 5 && service.length < 100) {
          services.add(service)
        }
      })
    }
  })
  
  return Array.from(services).slice(0, 10)
}

// Extract contact information
function extractContactInfo(content: string): string | null {
  const contactInfo = []
  
  // Email pattern
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  if (emailMatch) {
    contactInfo.push(`Email: ${emailMatch[0]}`)
  }
  
  // Phone pattern
  const phoneMatch = content.match(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g)
  if (phoneMatch) {
    contactInfo.push(`Phone: ${phoneMatch[0]}`)
  }
  
  // Address pattern (simplified)
  const addressMatch = content.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct)/gi)
  if (addressMatch) {
    contactInfo.push(`Address: ${addressMatch[0]}`)
  }
  
  return contactInfo.length > 0 ? contactInfo.join('\n') : null
}

export async function POST(request: NextRequest) {
  try {
    const { websiteId }: GeneratePromptRequest = await request.json()
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Missing websiteId' },
        { status: 400 }
      )
    }

    console.log(`Generating prompt for website ${websiteId}`)

    const supabase = createServerClient()

    // Get website and scraped content
    const { data: website, error: fetchError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (fetchError || !website) {
      throw new Error('Website not found or no content available')
    }

    if (!website.scraped_content) {
      throw new Error('No scraped content available for this website')
    }

    // Generate the system prompt
    const scrapedContent = website.scraped_content as ScrapedContent
    const systemPrompt = generateSystemPrompt(
      scrapedContent,
      website.url,
      website.title || 'Website'
    )

    // Update website with generated prompt
    const { error: updateError } = await supabase
      .from('websites')
      .update({
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', websiteId)

    if (updateError) {
      throw updateError
    }

    // Create default chatbot for this website
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .insert({
        website_id: websiteId,
        name: `${website.title || 'Website'} Assistant`,
        config: {
          welcome_message: `Hello! I'm here to help you with any questions about ${website.title || 'our website'}. How can I assist you today?`,
          theme: 'default',
          position: 'bottom-right'
        },
        is_active: true
      })
      .select()
      .single()

    if (chatbotError) {
      console.error('Error creating chatbot:', chatbotError)
      // Don't fail the whole process if chatbot creation fails
    }

    console.log(`Successfully generated prompt for website ${websiteId}`)

    return NextResponse.json({ 
      success: true,
      websiteId,
      chatbotId: chatbot?.id,
      promptLength: systemPrompt.length
    })

  } catch (error: any) {
    console.error('Prompt generation error:', error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}