// import { SubscriptionManager } from '@/lib/subscription-utils'
// import test, { describe, beforeEach } from 'node:test'

// describe('SubscriptionManager', () => {
//   let subscriptionManager: SubscriptionManager
  
//   beforeEach(() => {
//     subscriptionManager = new SubscriptionManager()
//   })

//   test('gets subscription limits correctly', async () => {
//     const limits = await subscriptionManager.getSubscriptionLimits('starter')
    
//     expect(limits).toEqual({
//       websites: 5,
//       chatbots: 5,
//       monthlyConversations: 1000,
//       storage: '1GB',
//       apiCalls: 10000
//     })
//   })

//   test('gets subscription features correctly', async () => {
//     const features = await subscriptionManager.getSubscriptionFeatures('professional')
    
//     expect(features).toEqual({
//       customBranding: true,
//       apiAccess: true,
//       prioritySupport: true,
//       customIntegrations: true,
//       advancedAnalytics: true,
//       whiteLabel: false,
//       sla: false
//     })
//   })

//   test('handles invalid plan gracefully', async () => {
//     const limits = await subscriptionManager.getSubscriptionLimits('invalid-plan')
//     expect(limits).toBeNull()
//   })
// })