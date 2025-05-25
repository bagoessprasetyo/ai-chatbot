// src/lib/subscription-utils.ts
import { createClient } from '@/lib/supabase'

export interface SubscriptionLimits {
  websites: number
  chatbots: number
  monthlyConversations: number
  storage: string
  apiCalls: number
}

export interface SubscriptionFeatures {
  customBranding: boolean
  apiAccess: boolean
  prioritySupport: boolean
  customIntegrations: boolean
  advancedAnalytics: boolean
  whiteLabel: boolean
  sla: boolean
}

export class SubscriptionManager {
  private supabase = createClient()

  async checkWebsiteLimit(userId: string): Promise<boolean> {
    const { data } = await this.supabase.rpc('can_create_website', { user_uuid: userId })
    return data || false
  }

  async checkChatbotLimit(userId: string): Promise<boolean> {
    const { data } = await this.supabase.rpc('can_create_chatbot', { user_uuid: userId })
    return data || false
  }

  async trackConversation(userId: string): Promise<boolean> {
    const { data } = await this.supabase.rpc('increment_conversation_usage', { user_uuid: userId })
    return data || false
  }

  async getSubscriptionLimits(planId: string): Promise<SubscriptionLimits | null> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('limits')
      .eq('id', planId)
      .single()

    if (error || !data) return null

    return {
      websites: data.limits.websites,
      chatbots: data.limits.chatbots,
      monthlyConversations: data.limits.monthlyConversations,
      storage: data.limits.storage,
      apiCalls: data.limits.apiCalls
    }
  }

  async getSubscriptionFeatures(planId: string): Promise<SubscriptionFeatures | null> {
    const features = {
      free: {
        customBranding: false,
        apiAccess: false,
        prioritySupport: false,
        customIntegrations: false,
        advancedAnalytics: false,
        whiteLabel: false,
        sla: false
      },
      starter: {
        customBranding: true,
        apiAccess: false,
        prioritySupport: true,
        customIntegrations: false,
        advancedAnalytics: true,
        whiteLabel: false,
        sla: false
      },
      professional: {
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        advancedAnalytics: true,
        whiteLabel: false,
        sla: false
      },
      enterprise: {
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        advancedAnalytics: true,
        whiteLabel: true,
        sla: true
      }
    }

    return features[planId as keyof typeof features] || null
  }

  async createTrialSubscription(userId: string): Promise<string> {
    const { data } = await this.supabase.rpc('create_trial_subscription', { user_uuid: userId })
    return data
  }

  async upgradePlan(userId: string, newPlanId: string, stripeSubscriptionId?: string): Promise<boolean> {
    const { data } = await this.supabase.rpc('update_subscription_plan', {
      user_uuid: userId,
      new_plan_id: newPlanId,
      stripe_subscription_id_param: stripeSubscriptionId
    })
    return data || false
  }

  async resetMonthlyUsage(): Promise<number> {
    const { data } = await this.supabase.rpc('reset_monthly_usage')
    return data || 0
  }

  async getUsageAnalytics(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('usage_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getSubscriptionMetrics(userId: string) {
    const { data: subscription } = await this.supabase
      .from('user_subscription_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) return null

    const websiteUsage = subscription.websites_limit === -1 ? 0 : 
      (subscription.websites_used / subscription.websites_limit) * 100

    const chatbotUsage = subscription.chatbots_limit === -1 ? 0 :
      (subscription.chatbots_used / subscription.chatbots_limit) * 100

    const conversationUsage = (subscription.monthly_conversations_used / subscription.monthly_conversations_limit) * 100

    return {
      subscription,
      usage: {
        websites: Math.min(websiteUsage, 100),
        chatbots: Math.min(chatbotUsage, 100),
        conversations: Math.min(conversationUsage, 100)
      },
      limits: {
        websites: subscription.websites_limit,
        chatbots: subscription.chatbots_limit,
        conversations: subscription.monthly_conversations_limit
      },
      remaining: {
        websites: subscription.websites_remaining,
        chatbots: subscription.chatbots_remaining,
        conversations: subscription.conversations_remaining
      }
    }
  }
}

// src/lib/email-templates.ts
export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailTemplates {
  static welcomeTrial(userName: string, trialEndDate: string): EmailTemplate {
    return {
      subject: 'Welcome to WebBot AI - Your Free Trial Starts Now!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to WebBot AI!</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Welcome to WebBot AI! Your 14-day free trial has started, and you now have access to all the tools you need to create intelligent chatbots for your website.
            </p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Trial Includes:</h3>
              <ul style="color: #666; padding-left: 20px;">
                <li>1 website connection</li>
                <li>1 chatbot</li>
                <li>100 conversations per month</li>
                <li>Basic analytics</li>
                <li>Email support</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your trial expires on <strong>${trialEndDate}</strong>. To continue using WebBot AI after your trial, simply choose a plan that fits your needs.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get Started Now</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions, just reply to this email. We're here to help!
            </p>
          </div>
        </div>
      `,
      text: `Welcome to WebBot AI!

Hi ${userName},

Your 14-day free trial has started! You now have access to create intelligent chatbots for your website.

Your trial includes:
- 1 website connection
- 1 chatbot  
- 100 conversations per month
- Basic analytics
- Email support

Your trial expires on ${trialEndDate}. Get started at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Questions? Just reply to this email!`
    }
  }

  static trialExpiring(userName: string, daysLeft: number): EmailTemplate {
    return {
      subject: `Your WebBot AI trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ff9500; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Trial Expiring Soon</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your WebBot AI trial expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Don't let your chatbots go offline!
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffecb5; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ What happens when your trial expires:</h3>
              <ul style="color: #856404; padding-left: 20px;">
                <li>Your chatbots will stop responding to visitors</li>
                <li>You'll lose access to analytics</li>
                <li>New conversations will be blocked</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Upgrade now to keep your chatbots running and unlock more powerful features.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade Now</a>
            </div>
          </div>
        </div>
      `,
      text: `Trial Expiring Soon

Hi ${userName},

Your WebBot AI trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. 

When your trial expires:
- Your chatbots will stop responding
- You'll lose access to analytics  
- New conversations will be blocked

Upgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`
    }
  }

  static trialExpired(userName: string): EmailTemplate {
    return {
      subject: 'Your WebBot AI trial has expired',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Trial Expired</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your WebBot AI trial has expired. Your chatbots are currently offline and not responding to visitors.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              The good news? You can reactivate everything instantly by choosing a plan. All your chatbot configurations and data are safely stored and ready to go.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reactivate Now</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Need help choosing a plan? Reply to this email and we'll help you find the perfect fit.
            </p>
          </div>
        </div>
      `,
      text: `Trial Expired

Hi ${userName},

Your WebBot AI trial has expired and your chatbots are currently offline.

You can reactivate everything instantly by choosing a plan. All your data is safely stored.

Reactivate now: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing

Need help? Just reply to this email!`
    }
  }

  static usageLimitWarning(userName: string, limitType: string, percentage: number): EmailTemplate {
    return {
      subject: `WebBot AI: You've used ${percentage}% of your ${limitType} quota`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ff9500; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Usage Alert</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You've used <strong>${percentage}%</strong> of your monthly ${limitType} quota. 
              ${percentage >= 90 ? 'You\'re very close to your limit!' : 'You\'re approaching your limit.'}
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Consider upgrading to a higher plan to avoid service interruption and unlock more features.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="background: #ff9500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Plans</a>
            </div>
          </div>
        </div>
      `,
      text: `Usage Alert

Hi ${userName},

You've used ${percentage}% of your monthly ${limitType} quota.

Consider upgrading: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`
    }
  }

  static subscriptionConfirmation(userName: string, planName: string, amount: number): EmailTemplate {
    return {
      subject: `Welcome to WebBot AI ${planName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${planName}!</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for upgrading to WebBot AI ${planName}! Your subscription is now active and you have access to all the premium features.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ Your subscription details:</h3>
              <ul style="color: #155724; padding-left: 20px;">
                <li>Plan: ${planName}</li>
                <li>Amount: $${(amount / 100).toFixed(2)}/month</li>
                <li>Billing: Monthly</li>
                <li>Status: Active</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You can manage your subscription anytime from your dashboard. Questions? We're here to help!
            </p>
          </div>
        </div>
      `,
      text: `Welcome to ${planName}!

Hi ${userName},

Thank you for upgrading to WebBot AI ${planName}! Your subscription is active.

Plan: ${planName}
Amount: $${(amount / 100).toFixed(2)}/month
Status: Active

Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    }
  }

  static paymentFailed(userName: string, planName: string): EmailTemplate {
    return {
      subject: 'Payment failed for your WebBot AI subscription',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Failed</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We were unable to process payment for your WebBot AI ${planName} subscription. Your account will remain active for a few more days while we attempt to collect payment.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Please update your payment method to avoid service interruption.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
            </div>
          </div>
        </div>
      `,
      text: `Payment Failed

Hi ${userName},

We couldn't process payment for your WebBot AI ${planName} subscription.

Please update your payment method: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`
    }
  }
}

// src/lib/subscription-jobs.ts
export class SubscriptionJobs {
  private supabase = createClient()
  private emailTemplates = EmailTemplates

  async sendTrialExpirationWarnings() {
    // Find trials expiring in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: expiringTrials } = await this.supabase
      .from('subscriptions')
      .select(`
        user_id,
        trial_end,
        profiles(full_name, email)
      `)
      .eq('status', 'trialing')
      .lte('trial_end', threeDaysFromNow.toISOString())
      .gt('trial_end', new Date().toISOString())

    for (const trial of expiringTrials || []) {
      const daysLeft = Math.ceil((new Date(trial.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 3 && daysLeft > 0) {
        const template = this.emailTemplates.trialExpiring(
          (trial.profiles?.[0]?.full_name) || 'User',
          daysLeft
        )
        
        // Send email (implement your email service here)
        console.log(`Would send trial expiring email to ${trial.profiles?.[0]?.email}`)
      }
    }
  }

  async handleExpiredTrials() {
    const now = new Date()

    const { data: expiredTrials } = await this.supabase
      .from('subscriptions')
      .select(`
        user_id,
        profiles(full_name, email)
      `)
      .eq('status', 'trialing')
      .lt('trial_end', now.toISOString())

    for (const trial of expiredTrials || []) {
      // Update status to expired
      await this.supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', trial.user_id)

      const template = this.emailTemplates.trialExpired(
        trial.profiles?.[0]?.full_name || 'User'
      )
      
      // Send email
      console.log(`Would send trial expired email to ${trial.profiles?.[0]?.email}`)
    }
  }

  async resetMonthlyUsage() {
    const resetCount = await this.supabase.rpc('reset_monthly_usage')
    console.log(`Reset monthly usage for ${resetCount} subscriptions`)
    return resetCount
  }

  async checkUsageLimits() {
    const { data: subscriptions } = await this.supabase
      .from('user_subscription_summary')
      .select('*')

    for (const subscription of subscriptions || []) {
      const conversationUsage = (subscription.monthly_conversations_used / subscription.monthly_conversations_limit) * 100
      
      if (conversationUsage >= 90) {
        // Send usage warning email
        console.log(`Would send usage warning to user ${subscription.user_id}`)
      }
    }
  }
}