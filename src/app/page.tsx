"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRightIcon, 
  MessageCircleIcon, 
  BotIcon, 
  CodeIcon, 
  BookOpenIcon, 
  ZapIcon, 
  UsersIcon,
  CheckIcon,
  StarIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  ClockIcon,
  BarChart3Icon,
  PlayIcon,
  QuoteIcon,
  ChevronRightIcon
} from "lucide-react";
import Link from "next/link";
import PricingSection from "@/components/PricingSection";

// Floating Navbar Component
interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

function FloatingNavBar({ items, className }: NavBarProps) {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const sections = ['home', 'features', 'pricing', 'testimonials'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999]">
      <div className="flex justify-center px-4">
        <motion.nav 
          className="flex items-center justify-between w-full max-w-7xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-lg px-6 py-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              WebBot AI
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavItem"
                      className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" asChild>
              <Link href="/auth/login">Get Started</Link>
            </Button>
          </div>
        </motion.nav>
      </div>
    </div>
  );
}

// Stat Component
interface StatProps {
  number: string;
  label: string;
  suffix?: string;
}

const Stat = ({ number, label, suffix = "" }: StatProps) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
      {number}<span className="text-blue-600">{suffix}</span>
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</div>
  </div>
);

// Feature Component
interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: string;
}

const Feature = ({ icon, title, description, gradient = "from-blue-500 to-purple-500" }: FeatureProps) => (
  <motion.div 
    className="group relative p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300"
    whileHover={{ y: -5 }}
  >
    <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

// Testimonial Component
interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
}

const Testimonial = ({ quote, author, role, company, avatar, rating }: TestimonialProps) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="flex items-center gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
      ))}
    </div>
    <blockquote className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      <QuoteIcon className="w-6 h-6 text-gray-400 mb-2" />
      "{quote}"
    </blockquote>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
        {avatar}
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white">{author}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{role} at {company}</div>
      </div>
    </div>
  </div>
);

// Main Homepage Component
function WebBotAIHome({ className }: { className?: string }) {
  const navItems = [
    { name: "Home", href: "#home", icon: BotIcon },
    { name: "Features", href: "#features", icon: BookOpenIcon },
    { name: "Pricing", href: "#pricing", icon: CodeIcon },
    { name: "Reviews", href: "#testimonials", icon: StarIcon },
  ];

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900", className)}>
      <FloatingNavBar items={navItems} />

      <main>
        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto max-w-7xl relative">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Trusted by 10,000+ businesses worldwide
                </Badge>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Transform Your Website
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Into an AI Powerhouse
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                  Deploy intelligent AI chatbots that understand your business, engage customers 24/7, 
                  and convert visitors into loyal customers. No coding required.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-xl" asChild>
                    <Link href="/auth/login">
                      Start Free Trial
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700 px-8 py-4 text-lg" asChild>
                    <Link href="#demo">
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Stat number="10k+" label="Active Businesses" />
                <Stat number="2.4M" label="Conversations Handled" />
                <Stat number="94" label="Customer Satisfaction" suffix="%" />
                <Stat number="5min" label="Setup Time" />
              </motion.div>

              {/* Demo Preview */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="relative max-w-6xl mx-auto"
              >
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="ml-4 text-sm text-gray-600 dark:text-gray-400">WebBot AI Dashboard</div>
                    </div>
                  </div>
                  <div className="p-8 h-96 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-center">
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                        <BotIcon className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Assistant Active</h3>
                        <p className="text-gray-600 dark:text-gray-400">Ready to engage with your customers</p>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-700 dark:text-green-400">Online</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Response time: &lt;1s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 bg-white dark:bg-gray-900">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Our comprehensive AI platform provides all the tools and features you need to create, deploy, and optimize intelligent chatbots for your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Feature
                icon={<BotIcon className="w-6 h-6" />}
                title="Smart AI Training"
                description="Advanced AI that learns from your website content, FAQs, and business data to provide accurate, contextual responses to customer inquiries."
                gradient="from-blue-500 to-cyan-500"
              />
              <Feature
                icon={<ZapIcon className="w-6 h-6" />}
                title="Instant Deployment"
                description="Go live in minutes with our simple embed code. Works seamlessly with WordPress, Shopify, React, and any website platform."
                gradient="from-purple-500 to-pink-500"
              />
              <Feature
                icon={<BarChart3Icon className="w-6 h-6" />}
                title="Advanced Analytics"
                description="Track conversations, measure engagement, identify trends, and optimize performance with comprehensive analytics dashboard."
                gradient="from-green-500 to-emerald-500"
              />
              <Feature
                icon={<UsersIcon className="w-6 h-6" />}
                title="Multi-Channel Support"
                description="Deploy your AI assistant across website, social media, messaging apps, and customer support platforms from one dashboard."
                gradient="from-orange-500 to-red-500"
              />
              <Feature
                icon={<ShieldCheckIcon className="w-6 h-6" />}
                title="Enterprise Security"
                description="Bank-level encryption, SOC 2 compliance, and GDPR-ready data handling ensure your customer data stays protected."
                gradient="from-indigo-500 to-purple-500"
              />
              <Feature
                icon={<ClockIcon className="w-6 h-6" />}
                title="24/7 Availability"
                description="Your AI assistant never sleeps, providing instant responses to customer inquiries around the clock, improving satisfaction."
                gradient="from-teal-500 to-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Trusted by Industry Leaders
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Join thousands of successful businesses already using WebBot AI
              </p>
            </div>

            {/* Company Logos */}
            <div className="flex flex-wrap justify-center items-center gap-12 mb-16 opacity-60">
              {['TechCorp', 'StartupXYZ', 'Enterprise Inc', 'Growth Co', 'Innovation Ltd', 'Future Corp'].map((company) => (
                <div key={company} className="text-2xl font-bold text-gray-400">
                  {company}
                </div>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <TrendingUpIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">+150%</div>
                <div className="text-gray-600 dark:text-gray-400">Average increase in customer engagement</div>
              </div>
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <ClockIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">75%</div>
                <div className="text-gray-600 dark:text-gray-400">Reduction in response time</div>
              </div>
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <UsersIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">40%</div>
                <div className="text-gray-600 dark:text-gray-400">Increase in lead conversion</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-4 bg-white dark:bg-gray-900">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Real stories from businesses that transformed their customer experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Testimonial
                quote="WebBot AI increased our customer satisfaction by 40% and reduced response time from hours to seconds. It's like having a customer service team that never sleeps."
                author="Sarah Johnson"
                role="Head of Customer Success"
                company="TechStart Inc"
                avatar="SJ"
                rating={5}
              />
              <Testimonial
                quote="The setup was incredibly easy, and the AI understood our complex product catalog immediately. Our conversion rate improved by 25% in the first month."
                author="Michael Chen"
                role="E-commerce Director"
                company="Fashion Forward"
                avatar="MC"
                rating={5}
              />
              <Testimonial
                quote="Best investment we've made this year. The analytics insights helped us understand our customers better and improve our entire sales process."
                author="Emily Rodriguez"
                role="Marketing Manager"
                company="Growth Solutions"
                avatar="ER"
                rating={5}
              />
            </div>
          </div>
        </section>

        <PricingSection />

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Join over 10,000 businesses using WebBot AI to provide exceptional customer experiences and drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-xl" asChild>
                <Link href="/auth/login">
                  Start Your Free Trial
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg" asChild>
                <Link href="#features">
                  View All Features
                </Link>
              </Button>
            </div>
            <p className="text-blue-100 text-sm mt-6">
              ✓ No credit card required  ✓ 30-day free trial  ✓ Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">WebBot AI</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering businesses worldwide with intelligent AI chatbots that enhance customer experience and drive growth.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                  LinkedIn
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 WebBot AI. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <WebBotAIHome />;
}