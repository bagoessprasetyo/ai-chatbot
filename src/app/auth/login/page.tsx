'use client'

import Link from 'next/link'
// import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
// import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
// import { Input } from '@/scomponents/ui/input'
// import { Label } from '@/components/ui/label'
import { BotIcon, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  // const [isLoading, setIsLoading] = useState(false)

  const customSupabaseTheme = {
    default: {
      colors: {
        brand: 'hsl(var(--primary))',
        brandAccent: 'hsl(var(--primary))',
        brandButtonText: 'hsl(var(--primary-foreground))',
        defaultButtonBackground: 'hsl(var(--secondary))',
        defaultButtonBackgroundHover: 'hsl(var(--secondary)/0.8)',
        defaultButtonBorder: 'hsl(var(--border))',
        defaultButtonText: 'hsl(var(--secondary-foreground))',
        dividerBackground: 'hsl(var(--border))',
        inputBackground: 'hsl(var(--background))',
        inputBorder: 'hsl(var(--border))',
        inputBorderHover: 'hsl(var(--border))',
        inputBorderFocus: 'hsl(var(--ring))',
        inputText: 'hsl(var(--foreground))',
        inputLabelText: 'hsl(var(--foreground))',
        inputPlaceholder: 'hsl(var(--muted-foreground))',
        messageText: 'hsl(var(--foreground))',
        messageTextDanger: 'hsl(var(--destructive))',
        anchorTextColor: 'hsl(var(--primary))',
        anchorTextHoverColor: 'hsl(var(--primary)/0.8)',
      },
      space: {
        spaceSmall: '4px',
        spaceMedium: '8px',
        spaceLarge: '16px',
        labelBottomMargin: '8px',
        anchorBottomMargin: '4px',
        emailInputSpacing: '4px',
        socialAuthSpacing: '4px',
        buttonPadding: '10px 15px',
        inputPadding: '10px 15px',
      },
      fontSizes: {
        baseBodySize: '14px',
        baseInputSize: '14px',
        baseLabelSize: '14px',
        baseButtonSize: '14px',
      },
      fonts: {
        bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
        labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
      },
      borderWidths: {
        buttonBorderWidth: '1px',
        inputBorderWidth: '1px',
      },
      radii: {
        borderRadiusButton: '6px',
        buttonBorderRadius: '6px',
        inputBorderRadius: '6px',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <Link href="/" className="flex items-center gap-2">
          <BotIcon className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">WebBot AI</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          {/* Welcome Section */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your WebBot AI account to continue building intelligent chatbots
            </p>
          </div>

          {/* Auth Card */}
          <Card className="border-0 shadow-xl bg-background/80 backdrop-blur-sm">
            <CardHeader className="pb-4 space-y-1">
              <CardTitle className="text-2xl text-center">Sign in</CardTitle>
              <CardDescription className="text-center">
                Choose your preferred sign-in method below
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Supabase Auth Component with Custom Styling */}
              <Auth
                supabaseClient={supabase}
                appearance={{ 
                  theme: ThemeSupa,
                  variables: customSupabaseTheme,
                  className: {
                    container: 'space-y-4',
                    button: 'w-full justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                    input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    message: 'text-sm text-muted-foreground',
                    divider: 'flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
                  }
                }}
                providers={['google', 'github']}
                redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard'}
                showLinks={true}
                view="sign_in"
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email address',
                      password_label: 'Password',
                      button_label: 'Sign in',
                      social_provider_text: 'Sign in with {{provider}}',
                      link_text: "Don't have an account? Sign up",
                      // confirmation_text: 'Check your email for the confirmation link'
                    },
                    sign_up: {
                      email_label: 'Email address',
                      password_label: 'Create a password',
                      button_label: 'Create account',
                      social_provider_text: 'Sign up with {{provider}}',
                      link_text: 'Already have an account? Sign in',
                      confirmation_text: 'Check your email for the confirmation link'
                    }
                  }
                }}
              />
            </CardContent>
            
            <CardFooter className="flex flex-col pt-2 space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Additional Help */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Need help getting started?{' '}
              <Link href="/help" className="font-medium text-primary hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}