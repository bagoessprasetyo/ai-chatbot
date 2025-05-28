// src/components/PricingSection.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, TrendingUp, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  features: string[];
  conversations: number;
  websites: number;
  chatbots: number;
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    description: 'Perfect for trying out WebBot AI',
    price: 0,
    currency: 'USD',
    period: '14 days',
    conversations: 100,
    websites: 1,
    chatbots: 1,
    features: [
      '100 conversations included',
      '1 website connection',
      '1 AI chatbot',
      'Basic analytics',
      'Email support',
      'No credit card required'
    ],
    icon: <Zap className="w-6 h-6" />,
    buttonText: 'Start Free Trial',
    buttonVariant: 'outline'
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Great for small businesses',
    price: 29,
    currency: 'USD',
    period: 'month',
    conversations: 500,
    websites: 1,
    chatbots: 2,
    features: [
      '500 conversations/month',
      '1 website connection',
      '2 AI chatbots',
      'Advanced analytics',
      'Custom branding',
      'Priority email support',
      'API access'
    ],
    icon: <Star className="w-6 h-6" />,
    buttonText: 'Get Started',
    buttonVariant: 'default'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Best for growing businesses',
    price: 79,
    originalPrice: 99,
    currency: 'USD',
    period: 'month',
    conversations: 2000,
    websites: 3,
    chatbots: 5,
    popular: true,
    features: [
      '2,000 conversations/month',
      '3 website connections',
      '5 AI chatbots',
      'Advanced analytics & insights',
      'Custom branding & themes',
      'Priority support',
      'Full API access',
      'Custom integrations',
      'White-label options'
    ],
    icon: <Crown className="w-6 h-6" />,
    buttonText: 'Go Professional',
    buttonVariant: 'default'
  }
];

interface PricingCardProps {
  plan: PricingPlan;
  isCurrentPlan?: boolean;
  onSelectPlan: (planId: string) => Promise<void>;
  loading?: boolean;
}

function PricingCard({ plan, isCurrentPlan, onSelectPlan, loading }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async () => {
    if (isCurrentPlan || isLoading || loading) return;
    
    setIsLoading(true);
    try {
      await onSelectPlan(plan.id);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "relative rounded-2xl border p-8 transition-all duration-200 hover:shadow-lg",
      plan.popular 
        ? "border-blue-200 bg-gradient-to-b from-blue-50 to-white ring-2 ring-blue-200" 
        : "border-gray-200 bg-white hover:border-gray-300",
      isCurrentPlan && "ring-2 ring-green-200 border-green-200"
    )}>
      {plan.popular && (
        <Badge className="absolute text-white transform -translate-x-1/2 -top-3 left-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
          Most Popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge className="absolute text-white transform -translate-x-1/2 bg-green-600 -top-3 left-1/2">
          Current Plan
        </Badge>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        )}>
          {plan.icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          <p className="text-sm text-gray-600">{plan.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">
            ${plan.price}
          </span>
          {plan.originalPrice && (
            <span className="text-lg text-gray-500 line-through">
              ${plan.originalPrice}
            </span>
          )}
          <span className="text-gray-600">
            {plan.price > 0 ? `/${plan.period}` : plan.period}
          </span>
        </div>
        {plan.originalPrice && (
          <Badge variant="secondary" className="mt-2">
            Save ${plan.originalPrice - plan.price}/month
          </Badge>
        )}
      </div>

      <div className="mb-8 space-y-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">{plan.conversations.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Conversations</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">{plan.websites}</div>
            <div className="text-xs text-gray-600">Websites</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">{plan.chatbots}</div>
            <div className="text-xs text-gray-600">Chatbots</div>
          </div>
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleSelectPlan}
        disabled={isCurrentPlan || isLoading || loading}
        variant={plan.buttonVariant}
        size="lg"
        className={cn(
          "w-full",
          plan.popular && "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
            Processing...
          </div>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          plan.buttonText
        )}
      </Button>
    </div>
  );
}

export default function PricingSection() {
  const { user, isAuthenticated } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login/signup
      window.location.href = '/auth/login';
      return;
    }

    if (planId === 'free') {
      // Redirect to dashboard for free trial
      window.location.href = '/dashboard';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-polar-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You might want to show a toast notification here
      alert(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanId = () => {
    return subscription?.plan_id || 'free';
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 mx-auto">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Simple, Transparent Pricing
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Choose the Perfect Plan for Your Business
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-gray-600">
            Start with our free trial and upgrade as your business grows. 
            All plans include our core AI chatbot features with no setup fees.
          </p>
        </div>

        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={getCurrentPlanId() === plan.id}
              onSelectPlan={handleSelectPlan}
              loading={loading || subscriptionLoading}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-4xl p-8 mx-auto bg-white border border-gray-200 rounded-2xl">
            <h3 className="mb-4 text-2xl font-semibold text-gray-900">
              Need Something Custom?
            </h3>
            <p className="mb-6 text-gray-600">
              Looking for enterprise features, custom integrations, or higher limits? 
              We would love to work with you to create a plan that fits your specific needs.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
              <Button variant="ghost" size="lg">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-sm text-center text-gray-500">
          <p>
            All plans include SSL security, 99.9% uptime SLA, and can be cancelled anytime. 
            Prices are in USD and billed monthly.
          </p>
        </div>
      </div>
    </section>
  );
}