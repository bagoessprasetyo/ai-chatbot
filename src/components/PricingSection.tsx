"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ArrowRight, Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface PricingTier {
  id?: string;
  name: string;
  price: Record<string, number | string>;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  paymentFrequency: string;
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const price = tier.price[paymentFrequency];
  const isHighlighted = tier.highlighted;
  const isPopular = tier.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="relative"
    >
      <Card
        className={cn(
          "relative flex flex-col gap-8 overflow-hidden p-8 border transition-all duration-300 hover:shadow-xl h-full",
          isHighlighted
            ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105"
            : "bg-white dark:bg-gray-900 text-foreground hover:scale-105",
          isPopular && "ring-2 ring-blue-500 shadow-lg"
        )}
      >
        {isHighlighted && <HighlightedBackground />}
        {isPopular && <PopularBackground />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isHighlighted && <Crown className="w-5 h-5 text-yellow-400" />}
            {isPopular && <Zap className="w-5 h-5 text-blue-500" />}
            <h2 className="text-xl font-semibold capitalize">{tier.name}</h2>
          </div>
          {isPopular && (
            <Badge className="bg-blue-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" /> Most Popular
            </Badge>
          )}
          {isHighlighted && (
            <Badge className="bg-yellow-500 text-black border-0">
              <Crown className="h-3 w-3 mr-1" /> Best Value
            </Badge>
          )}
        </div>

        <div className="relative">
          {typeof price === "number" ? (
            <>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">${price}</span>
                <span className={cn(
                  "text-lg ml-1",
                  isHighlighted ? "text-white/80" : "text-muted-foreground"
                )}>
                  /{paymentFrequency === "yearly" ? "year" : "month"}
                </span>
              </div>
              {paymentFrequency === "yearly" && typeof tier.price.monthly === "number" && (
                <p className={cn(
                  "text-sm mt-1",
                  isHighlighted ? "text-white/70" : "text-muted-foreground"
                )}>
                  Save ${(tier.price.monthly * 12) - price} per year
                </p>
              )}
            </>
          ) : (
            <h1 className="text-4xl font-bold">{price}</h1>
          )}
        </div>

        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-medium mb-4",
            isHighlighted ? "text-white/90" : "text-muted-foreground"
          )}>
            {tier.description}
          </h3>
          <ul className="space-y-3">
            {tier.features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  isHighlighted ? "text-white/90" : "text-muted-foreground"
                )}
              >
                <BadgeCheck className={cn(
                  "h-5 w-5 flex-shrink-0 mt-0.5",
                  isHighlighted ? "text-green-400" : "text-green-500"
                )} />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <Button
          className={cn(
            "w-full mt-auto",
            isHighlighted 
              ? "bg-white text-blue-600 hover:bg-gray-100" 
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          )}
          size="lg"
        >
          {tier.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </motion.div>
  );
}

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1e_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1e_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
);

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))]" />
);

interface TabProps {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}

export function Tab({
  text,
  selected,
  setSelected,
  discount = false,
}: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative w-fit px-6 py-3 text-sm font-semibold capitalize transition-colors",
        "text-foreground",
        discount && "flex items-center justify-center gap-2.5"
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-white dark:bg-gray-800 shadow-sm"
        />
      )}
      {discount && (
        <Badge
          variant="secondary"
          className={cn(
            "relative z-10 whitespace-nowrap shadow-none bg-green-100 text-green-700",
            selected && "bg-green-200"
          )}
        >
          Save 35%
        </Badge>
      )}
    </button>
  );
}

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
}

export default function PricingSection({
  title = "Simple, Transparent Pricing",
  subtitle = "Choose the perfect plan to scale your customer engagement",
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState("monthly");

  const tiers: PricingTier[] = [
    {
      id: "free",
      name: "Free Trial",
      price: {
        monthly: 0,
        yearly: 0,
      },
      description: "Perfect for trying out WebBot AI",
      features: [
        "1 website integration",
        "1 AI chatbot",
        "Up to 100 conversations/month",
        "Basic analytics",
        "Email support",
        "14-day trial",
        "Custom branding"
      ],
      cta: "Start Free Trial",
    },
    {
      id: "starter",
      name: "Starter",
      price: {
        monthly: 29,
        yearly: 24,
      },
      description: "Great for small businesses",
      features: [
        "2 website integrations",
        "2 AI chatbots",
        "Up to 500 conversations/month",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
        "Email notifications"
      ],
      cta: "Start Starter Plan",
    },
    {
      id: "professional",
      name: "Professional",
      price: {
        monthly: 79,
        yearly: 65,
      },
      description: "Perfect for growing businesses",
      features: [
        "5 website integrations",
        "5 AI chatbots",
        "Up to 2,000 conversations/month",
        "Premium analytics",
        "API access",
        "Custom integrations",
        "Priority support",
        "Advanced features"
      ],
      cta: "Start Professional",
      popular: true,
    },
  ];

  const frequencies = ["monthly", "yearly"];

  return (
    <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f0e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f0e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-7xl relative">
        <div className="space-y-12 text-center">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h1 className="text-4xl font-bold md:text-5xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </motion.div>
          
          <motion.div 
            className="mx-auto flex w-fit rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {frequencies.map((freq) => (
              <Tab
                key={freq}
                text={freq}
                selected={selectedFrequency === freq}
                setSelected={setSelectedFrequency}
                discount={freq === "yearly"}
              />
            ))}
          </motion.div>
        </div>

        <div className="grid w-full gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <PricingCard
                tier={tier}
                paymentFrequency={selectedFrequency}
              />
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div 
          className="text-center mt-16 space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-600 dark:text-gray-400">
            ✓ All plans include SSL encryption and GDPR compliance
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            ✓ 30-day money-back guarantee • ✓ Cancel anytime • ✓ No setup fees
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" size="sm">
              View Feature Comparison
            </Button>
            <Button variant="outline" size="sm">
              Talk to Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}