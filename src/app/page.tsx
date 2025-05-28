"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, MessageCircleIcon, BotIcon, CodeIcon, BookOpenIcon, ZapIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import PricingSection from "@/components/PricingSection";

// Custom components implementation
const mockupVariants = {
  responsive: "rounded-md",
};

interface MockupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: keyof typeof mockupVariants;
}

const Mockup = React.forwardRef<HTMLDivElement, MockupProps>(
  ({ className, type = "responsive", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex relative z-10 overflow-hidden shadow-2xl border border-border/5 border-t-border/15",
        mockupVariants[type],
        className
      )}
      {...props}
    />
  )
);
Mockup.displayName = "Mockup";

const glowVariants = {
  top: "top-0",
  above: "-top-[128px]",
  bottom: "bottom-0",
  below: "-bottom-[128px]",
  center: "top-[50%]",
};

interface GlowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof glowVariants;
}

const Glow = React.forwardRef<HTMLDivElement, GlowProps>(
  ({ className, variant = "top", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("absolute w-full", glowVariants[variant], className)}
      {...props}
    >
      <div
        className={cn(
          "absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsla(var(--primary)/.5)_10%,_hsla(var(--primary)/0)_60%)] sm:h-[512px]",
          variant === "center" && "-translate-y-1/2"
        )}
      />
      <div
        className={cn(
          "absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_hsla(var(--primary)/.3)_10%,_hsla(var(--primary)/0)_60%)] sm:h-[256px]",
          variant === "center" && "-translate-y-1/2"
        )}
      />
    </div>
  )
);
Glow.displayName = "Glow";

// Feature component
interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature = ({ icon, title, description }: FeatureProps) => {
  return (
    <div className="flex flex-col items-start gap-2 p-6 transition-all border rounded-lg shadow-sm border-border/40 bg-background/50 hover:border-border/80 hover:bg-background/80">
      <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

// Main component
interface WebBotAIHomeProps {
  className?: string;
}

function WebBotAIHome({ className }: WebBotAIHomeProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16 mx-auto">
          <div className="flex items-center gap-2">
            <BotIcon className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">WebBot AI</span>
          </div>
          <nav className="items-center hidden gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </a>
            <a href="#docs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Documentation
            </a>
            <a href="#blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Blog
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/login">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 py-12 overflow-hidden bg-background text-foreground sm:py-24 md:py-32">
          <div className="flex flex-col max-w-6xl gap-12 pt-16 mx-auto sm:gap-24">
            <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
              {/* Badge */}
              <Badge variant="outline" className="gap-2 animate-appear">
                <span className="text-muted-foreground">✨ Introducing WebBot AI</span>
                <a href="#features" className="flex items-center gap-1">
                  Learn more
                  <ArrowRightIcon className="w-3 h-3" />
                </a>
              </Badge>

              {/* Title */}
              <h1 className="relative z-10 inline-block text-4xl font-semibold leading-tight text-transparent animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight">
                AI Chatbots for <br />
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                  Any Website
                </span>
              </h1>

              {/* Description */}
              <p className="text-md relative z-10 max-w-[650px] animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
                Automatically create intelligent chatbots for your website using AI. 
                No coding required - just add your URL and deploy in minutes.
              </p>

              {/* Actions */}
              <div className="relative z-10 flex justify-center gap-4 delay-300 opacity-0 animate-appear">
                <Button size="lg" asChild>
                  <Link href="/auth/login">Get Started Free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#features" className="flex items-center gap-2">
                    <MessageCircleIcon className="w-4 h-4" />
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Demo Preview */}
              <div className="relative w-full pt-12">
                <Mockup className="max-w-5xl mx-auto delay-700 opacity-0 animate-appear bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <div className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
                    <div className="space-y-4 text-center">
                      <BotIcon className="w-16 h-16 mx-auto text-blue-600" />
                      <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                        ChatBot Demo
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Interactive AI assistant ready to help your customers
                      </p>
                    </div>
                  </div>
                </Mockup>
                <Glow
                  variant="top"
                  className="delay-1000 opacity-0 animate-appear-zoom"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 bg-background/50">
          <div className="container mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Powerful Features Built for Your Success
              </h2>
              <p className="max-w-3xl mx-auto mt-4 text-xl text-muted-foreground">
                WebBot AI automatically understands your website content and creates intelligent, context-aware conversations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<BookOpenIcon className="w-6 h-6" />}
                title="Auto Website Scraping"
                description="AI automatically reads and understands your website content to provide accurate, contextual responses."
              />
              <Feature
                icon={<MessageCircleIcon className="w-6 h-6" />}
                title="Intelligent Responses"
                description="Context-aware answers based on your specific content, ensuring customers get relevant information."
              />
              <Feature
                icon={<ZapIcon className="w-6 h-6" />}
                title="Quick Deployment"
                description="Copy-paste embed code to go live in under 5 minutes. Works with any website platform."
              />
              <Feature
                icon={<UsersIcon className="w-6 h-6" />}
                title="24/7 Customer Support"
                description="Your chatbot never sleeps, providing instant responses to customer inquiries around the clock."
              />
              <Feature
                icon={<CodeIcon className="w-6 h-6" />}
                title="Easy Integration"
                description="Simple installation with just a few lines of code. No technical expertise required."
              />
              <Feature
                icon={<BotIcon className="w-6 h-6" />}
                title="Analytics Dashboard"
                description="Track conversations, measure engagement, and optimize your chatbot's performance with detailed insights."
              />
            </div>
          </div>
        </section>

        <PricingSection />

        {/* CTA Section */}
        <section className="px-4 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to Transform Your Website?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-xl text-blue-100">
              Join thousands of businesses using WebBot AI to enhance customer engagement and boost conversions.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="#features">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border/40 bg-background">
        <div className="container flex flex-col items-center justify-between gap-6 mx-auto md:flex-row">
          <div className="flex items-center gap-2">
            <BotIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold">WebBot AI</span>
            <span className="text-sm text-muted-foreground">© 2024 All rights reserved</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <WebBotAIHome />;
}