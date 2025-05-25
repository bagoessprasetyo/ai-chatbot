// // __tests__/subscription/SubscriptionContext.test.tsx
// import React from 'react'
// import { render, screen, waitFor } from '@testing-library/react'
// import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext'
// import { useAuth } from '@/hooks/useAuth'
// import { createClient } from '@/lib/supabase'

// // Mock dependencies
// jest.mock('@/hooks/useAuth')
// jest.mock('@/lib/supabase')

// const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
// const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// const TestComponent = () => {
//   const {
//     subscription,
//     loading,
//     canCreateWebsite,
//     canCreateChatbot,
//     canSendMessage,
//     isTrialActive,
//     getTrialDaysRemaining,
//     getCurrentPlan,
//     getUsagePercentage
//   } = useSubscription()

//   if (loading) return <div>Loading...</div>

//   return (
//     <div>
//       <div data-testid="plan-name">{getCurrentPlan()}</div>
//       <div data-testid="can-create-website">{canCreateWebsite().toString()}</div>
//       <div data-testid="can-create-chatbot">{canCreateChatbot().toString()}</div>
//       <div data-testid="can-send-message">{canSendMessage().toString()}</div>
//       <div data-testid="is-trial-active">{isTrialActive().toString()}</div>
//       <div data-testid="trial-days-remaining">{getTrialDaysRemaining()}</div>
//       <div data-testid="website-usage">{getUsagePercentage('websites')}</div>
//       <div data-testid="chatbot-usage">{getUsagePercentage('chatbots')}</div>
//       <div data-testid="conversation-usage">{getUsagePercentage('conversations')}</div>
//     </div>
//   )
// }

// describe('SubscriptionContext', () => {
//   const mockUser = {
//     id: 'test-user-id',
//     email: 'test@example.com'
//   }

//   const mockSubscription = {
//     id: 'test-subscription-id',
//     user_id: 'test-user-id',
//     plan_id: 'starter',
//     status: 'active',
//     trial_start: null,
//     trial_end: null,
//     monthly_conversations_limit: 1000,
//     monthly_conversations_used: 250,
//     websites_limit: 5,
//     chatbots_limit: 5,
//     plan_name: 'Starter',
//     features: ['5 websites', '5 chatbots', '1,000 conversations/month'],
//     limits: {
//       websites: 5,
//       chatbots: 5,
//       monthlyConversations: 1000
//     },
//     websites_used: 2,
//     chatbots_used: 3,
//     websites_remaining: 3,
//     chatbots_remaining: 2,
//     conversations_remaining: 750,
//     created_at: '2024-01-01T00:00:00Z',
//     updated_at: '2024-01-01T00:00:00Z'
//   }

//   const mockSupabaseClient = {
//     from: jest.fn().mockReturnThis(),
//     select: jest.fn().mockReturnThis(),
//     eq: jest.fn().mockReturnThis(),
//     single: jest.fn()
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockUseAuth.mockReturnValue({ user: mockUser } as any)
//     mockCreateClient.mockReturnValue(mockSupabaseClient as any)
//   })

//   test('loads subscription data correctly', async () => {
//     mockSupabaseClient.single.mockResolvedValue({
//       data: mockSubscription,
//       error: null
//     })

//     render(
//       <SubscriptionProvider>
//         <TestComponent />
//       </SubscriptionProvider>
//     )

//     await waitFor(() => {
//       expect(screen.getByTestId('plan-name')).toHaveTextContent('Starter')
//       expect(screen.getByTestId('can-create-website')).toHaveTextContent('true')
//       expect(screen.getByTestId('can-create-chatbot')).toHaveTextContent('true')
//       expect(screen.getByTestId('can-send-message')).toHaveTextContent('true')
//       expect(screen.getByTestId('is-trial-active')).toHaveTextContent('false')
//     })
//   })

//   test('handles trial subscription correctly', async () => {
//     const trialSubscription = {
//       ...mockSubscription,
//       status: 'trialing',
//       trial_start: '2024-01-01T00:00:00Z',
//       trial_end: '2024-01-15T00:00:00Z'
//     }

//     mockSupabaseClient.single.mockResolvedValue({
//       data: trialSubscription,
//       error: null
//     })

//     render(
//       <SubscriptionProvider>
//         <TestComponent />
//       </SubscriptionProvider>
//     )

//     await waitFor(() => {
//       expect(screen.getByTestId('is-trial-active')).toHaveTextContent('true')
//     })
//   })

//   test('calculates usage percentages correctly', async () => {
//     mockSupabaseClient.single.mockResolvedValue({
//       data: mockSubscription,
//       error: null
//     })

//     render(
//       <SubscriptionProvider>
//         <TestComponent />
//       </SubscriptionProvider>
//     )

//     await waitFor(() => {
//       expect(screen.getByTestId('website-usage')).toHaveTextContent('40') // 2/5 * 100
//       expect(screen.getByTestId('chatbot-usage')).toHaveTextContent('60') // 3/5 * 100
//       expect(screen.getByTestId('conversation-usage')).toHaveTextContent('25') // 250/1000 * 100
//     })
//   })

//   test('handles no subscription gracefully', async () => {
//     mockSupabaseClient.single.mockResolvedValue({
//       data: null,
//       error: { code: 'PGRST116' }
//     })

//     render(
//       <SubscriptionProvider>
//         <TestComponent />
//       </SubscriptionProvider>
//     )

//     await waitFor(() => {
//       expect(screen.getByTestId('plan-name')).toHaveTextContent('Free')
//       expect(screen.getByTestId('can-create-website')).toHaveTextContent('true') // Allows first creation
//     })
//   })
// })

// // __tests__/subscription/SubscriptionManager.test.ts


// // __tests__/subscription/hooks/useSubscriptionLimits.test.tsx
// import { renderHook } from '@testing-library/react'
// import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
// import { useSubscription } from '@/contexts/SubscriptionContext'
// import { useRouter } from 'next/navigation'

// jest.mock('@/contexts/SubscriptionContext')
// jest.mock('next/navigation')
// jest.mock('sonner')

// const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>
// const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// describe('useSubscriptionLimits', () => {
//   const mockRouter = {
//     push: jest.fn()
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockUseRouter.mockReturnValue(mockRouter as any)
//   })

//   test('returns true when user can create website', () => {
//     mockUseSubscription.mockReturnValue({
//       canCreateWebsite: () => true,
//       canCreateChatbot: () => true,
//       canSendMessage: () => true,
//       getUsagePercentage: () => 50,
//       shouldShowUpgradePrompt: () => false
//     } as any)

//     const { result } = renderHook(() => useSubscriptionLimits())
    
//     expect(result.current.checkWebsiteLimit(false)).toBe(true)
//   })

//   test('returns false and redirects when user cannot create website', () => {
//     mockUseSubscription.mockReturnValue({
//       canCreateWebsite: () => false,
//       canCreateChatbot: () => true,
//       canSendMessage: () => true,
//       getUsagePercentage: () => 100,
//       shouldShowUpgradePrompt: () => true
//     } as any)

//     const { result } = renderHook(() => useSubscriptionLimits())
    
//     expect(result.current.checkWebsiteLimit()).toBe(false)
//     expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/settings?tab=billing')
//   })

//   test('warns when usage is near limit', () => {
//     mockUseSubscription.mockReturnValue({
//       canCreateWebsite: () => true,
//       canCreateChatbot: () => true,
//       canSendMessage: () => true,
//       getUsagePercentage: (type: string) => type === 'websites' ? 95 : 50,
//       shouldShowUpgradePrompt: () => false
//     } as any)

//     const { result } = renderHook(() => useSubscriptionLimits())
    
//     result.current.warnIfNearLimit('websites')
//     // Toast warning should be called (would need to mock sonner)
//   })
// })

// // __tests__/api/subscription/usage.test.ts
// import { POST } from '@/app/api/subscription/usage/route'
// import { NextRequest } from 'next/server'
// import { createClient } from '@/lib/supabase'

// jest.mock('@/lib/supabase')

// const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// describe('/api/subscription/usage', () => {
//   const mockSupabaseClient = {
//     rpc: jest.fn(),
//     from: jest.fn().mockReturnThis(),
//     insert: jest.fn()
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockCreateClient.mockReturnValue(mockSupabaseClient as any)
//   })

//   test('successfully tracks conversation usage', async () => {
//     mockSupabaseClient.rpc.mockResolvedValue(true)
//     mockSupabaseClient.insert.mockResolvedValue({ error: null })

//     const request = new NextRequest('http://localhost/api/subscription/usage', {
//       method: 'POST',
//       body: JSON.stringify({
//         userId: 'test-user-id',
//         type: 'conversation',
//         metadata: { chatbotId: 'test-chatbot-id' }
//       })
//     })

//     const response = await POST(request)
//     const data = await response.json()

//     expect(response.status).toBe(200)
//     expect(data.success).toBe(true)
//     expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('increment_conversation_usage', {
//       user_uuid: 'test-user-id'
//     })
//   })

//   test('returns 429 when usage limit exceeded', async () => {
//     mockSupabaseClient.rpc.mockResolvedValue(false)

//     const request = new NextRequest('http://localhost/api/subscription/usage', {
//       method: 'POST',
//       body: JSON.stringify({
//         userId: 'test-user-id',
//         type: 'conversation'
//       })
//     })

//     const response = await POST(request)
//     const data = await response.json()

//     expect(response.status).toBe(429)
//     expect(data.error).toBe('Usage limit exceeded')
//     expect(data.code).toBe('LIMIT_EXCEEDED')
//   })

//   test('validates required fields', async () => {
//     const request = new NextRequest('http://localhost/api/subscription/usage', {
//       method: 'POST',
//       body: JSON.stringify({
//         userId: 'test-user-id'
//         // missing type
//       })
//     })

//     const response = await POST(request)
//     const data = await response.json()

//     expect(response.status).toBe(400)
//     expect(data.error).toBe('Missing userId or type')
//   })
// })

// // __tests__/components/subscription/UsageDisplay.test.tsx
// import React from 'react'
// import { render, screen } from '@testing-library/react'
// import { UsageDisplay } from '@/components/UsageDisplay'
// import { useSubscription } from '@/contexts/SubscriptionContext'

// jest.mock('@/contexts/SubscriptionContext')

// const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>

// describe('UsageDisplay', () => {
//   test('renders loading state', () => {
//     mockUseSubscription.mockReturnValue({
//       loading: true,
//       subscription: null
//     } as any)

//     render(<UsageDisplay />)
    
//     expect(screen.getByText(/loading/i)).toBeInTheDocument()
//   })

//   test('renders no subscription state', () => {
//     mockUseSubscription.mockReturnValue({
//       loading: false,
//       subscription: null
//     } as any)

//     render(<UsageDisplay />)
    
//     expect(screen.getByText('No Subscription')).toBeInTheDocument()
//     expect(screen.getByText('Get Started')).toBeInTheDocument()
//   })

//   test('renders subscription usage correctly', () => {
//     const mockSubscription = {
//       status: 'active',
//       plan_name: 'Starter',
//       monthly_conversations_used: 250,
//       monthly_conversations_limit: 1000,
//       websites_used: 2,
//       websites_limit: 5,
//       chatbots_used: 3,
//       chatbots_limit: 5
//     }

//     mockUseSubscription.mockReturnValue({
//       loading: false,
//       subscription: mockSubscription,
//       getCurrentPlan: () => 'Starter',
//       isTrialActive: () => false,
//       getTrialDaysRemaining: () => 0,
//       shouldShowUpgradePrompt: () => false,
//       getUsagePercentage: (type: string) => {
//         switch (type) {
//           case 'conversations': return 25
//           case 'websites': return 40
//           case 'chatbots': return 60
//           default: return 0
//         }
//       }
//     } as any)

//     render(<UsageDisplay />)
    
//     expect(screen.getByText('Starter')).toBeInTheDocument()
//     expect(screen.getByText('250 / 1,000')).toBeInTheDocument()
//     expect(screen.getByText('2 / 5')).toBeInTheDocument()
//     expect(screen.getByText('3 / 5')).toBeInTheDocument()
//   })

//   test('shows upgrade prompt when needed', () => {
//     mockUseSubscription.mockReturnValue({
//       loading: false,
//       subscription: { status: 'active' },
//       shouldShowUpgradePrompt: () => true,
//       isTrialActive: () => false
//     } as any)

//     render(<UsageDisplay />)
    
//     expect(screen.getByText('Upgrade')).toBeInTheDocument()
//   })
// })

// // __tests__/lib/email-templates.test.ts
// import { EmailTemplates } from '@/lib/email-templates'

// describe('EmailTemplates', () => {
//   test('generates welcome trial email correctly', () => {
//     const template = EmailTemplates.welcomeTrial('John Doe', '2024-01-15')
    
//     expect(template.subject).toBe('Welcome to WebBot AI - Your Free Trial Starts Now!')
//     expect(template.html).toContain('John Doe')
//     expect(template.html).toContain('2024-01-15')
//     expect(template.text).toContain('John Doe')
//     expect(template.text).toContain('2024-01-15')
//   })

//   test('generates trial expiring email correctly', () => {
//     const template = EmailTemplates.trialExpiring('Jane Smith', 3)
    
//     expect(template.subject).toBe('Your WebBot AI trial expires in 3 days')
//     expect(template.html).toContain('Jane Smith')
//     expect(template.html).toContain('3 days')
//     expect(template.text).toContain('Jane Smith')
//     expect(template.text).toContain('3 days')
//   })

//   test('handles singular day correctly', () => {
//     const template = EmailTemplates.trialExpiring('John Doe', 1)
    
//     expect(template.subject).toBe('Your WebBot AI trial expires in 1 day')
//     expect(template.html).toContain('1 day')
//     expect(template.text).toContain('1 day')
//   })

//   test('generates usage limit warning correctly', () => {
//     const template = EmailTemplates.usageLimitWarning('John Doe', 'conversation', 90)
    
//     expect(template.subject).toBe('WebBot AI: You\'ve used 90% of your conversation quota')
//     expect(template.html).toContain('John Doe')
//     expect(template.html).toContain('90%')
//     expect(template.html).toContain('conversation')
//   })

//   test('generates subscription confirmation correctly', () => {
//     const template = EmailTemplates.subscriptionConfirmation('John Doe', 'Starter', 1900)
    
//     expect(template.subject).toBe('Welcome to WebBot AI Starter!')
//     expect(template.html).toContain('John Doe')
//     expect(template.html).toContain('Starter')
//     expect(template.html).toContain('$19.00/month')
//   })
// })

// // Integration test example
// // __tests__/integration/subscription-flow.test.ts
// describe('Subscription Flow Integration', () => {
//   test('complete subscription flow', async () => {
//     // This would test the complete flow:
//     // 1. User signs up
//     // 2. Trial subscription is created
//     // 3. User creates website (triggers usage tracking)
//     // 4. User reaches limits
//     // 5. User upgrades
//     // 6. Limits are updated
    
//     // Implementation would involve setting up test database,
//     // mocking Stripe, and testing the full flow
//     expect(true).toBe(true) // Placeholder
//   })
// })

// // Package.json scripts for running tests
// const packageJsonScripts = {
//   "test": "jest",
//   "test:watch": "jest --watch",
//   "test:coverage": "jest --coverage",
//   "test:subscription": "jest --testPathPattern=subscription",
//   "test:integration": "jest --testPathPattern=integration"
// }