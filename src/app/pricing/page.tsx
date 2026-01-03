'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Check,
  IndianRupee,
  Sparkles,
  MessageSquare,
  Search,
  Heart,
  Download,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react'

const plans = [
  {
    id: 'day',
    name: 'Day Pass',
    price: 29,
    period: 'day',
    description: 'Perfect for quick property searches',
    features: [
      { text: '5 property contacts', included: true },
      { text: 'Basic search filters', included: true },
      { text: 'Chat with owners', included: true },
      { text: '24 hours access', included: true },
      { text: 'Save favorites', included: false },
      { text: 'Price insights', included: false },
      { text: 'Download PDFs', included: false },
    ],
    popular: false,
    color: 'bg-card',
  },
  {
    id: 'weekly',
    name: 'Weekly Pass',
    price: 99,
    period: 'week',
    description: 'Best for serious property hunters',
    features: [
      { text: '20 property contacts', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Chat with owners', included: true },
      { text: '7 days access', included: true },
      { text: 'Save favorites', included: true },
      { text: 'Priority support', included: true },
      { text: 'Download PDFs', included: false },
    ],
    popular: true,
    color: 'bg-gradient-to-br from-primary to-accent',
  },
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: 299,
    period: 'month',
    description: 'Unlimited access for power users',
    features: [
      { text: 'Unlimited contacts', included: true },
      { text: 'All premium filters', included: true },
      { text: 'Chat with owners', included: true },
      { text: '30 days access', included: true },
      { text: 'Save favorites', included: true },
      { text: 'Priority support', included: true },
      { text: 'Download PDFs', included: true },
      { text: 'Price insights', included: true },
    ],
    popular: false,
    color: 'bg-card',
  },
]

const faqs = [
  {
    question: 'What happens after my subscription expires?',
    answer: 'Your subscription will automatically deactivate. You can renew anytime to continue accessing contact details. Your saved favorites will remain in your account.',
  },
  {
    question: 'Can I upgrade my plan mid-subscription?',
    answer: 'Yes! You can upgrade at any time. The remaining days from your current plan will be adjusted proportionally to your new plan.',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'We offer a full refund within 24 hours of purchase if you haven\'t used any contacts. After that, refunds are processed on a case-by-case basis.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit/debit cards, UPI, net banking, and popular wallets like Paytm, PhonePe, and Google Pay.',
  },
  {
    question: 'Are there any hidden charges?',
    answer: 'Absolutely not! The price you see is the price you pay. No brokerage, no hidden fees, no commissions.',
  },
]

const benefits = [
  {
    icon: MessageSquare,
    title: 'Direct Contact',
    description: 'Chat and call property owners directly without any middlemen',
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'All properties are verified to ensure authenticity and trust',
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description: 'Get AI-powered price predictions and market trends',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Your subscription activates immediately after payment',
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }
    toast.success('Redirecting to payment...')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <section className="py-20 hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Simple, Transparent Pricing
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Choose Your
                <br />
                <span className="text-gradient font-serif italic">Perfect Plan</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Unlock direct access to property owners and find your dream home faster.
                No brokerage fees, no hidden charges.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 -mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? `${plan.color} text-primary-foreground scale-105 shadow-2xl z-10`
                      : `${plan.color} border`
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-background text-foreground shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className={plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    <IndianRupee className="w-8 h-8" />
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className={plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      /{plan.period}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            feature.included
                              ? plan.popular
                                ? 'bg-primary-foreground/20'
                                : 'bg-primary/10'
                              : 'bg-muted'
                          }`}
                        >
                          {feature.included ? (
                            <Check className={`w-3 h-3 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                          ) : (
                            <span className="w-1.5 h-0.5 bg-muted-foreground rounded" />
                          )}
                        </div>
                        <span
                          className={
                            feature.included
                              ? ''
                              : plan.popular
                              ? 'text-primary-foreground/50 line-through'
                              : 'text-muted-foreground line-through'
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-12 ${
                      plan.popular
                        ? 'bg-background text-foreground hover:bg-background/90'
                        : ''
                    }`}
                    variant={plan.popular ? 'secondary' : 'default'}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {user ? 'Get Started' : 'Sign Up & Subscribe'}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Subscribe?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get the most out of your property search with our premium features
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-2xl border bg-card"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Find Your Dream Home?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10">
              Join thousands of happy customers who found their perfect property on NestFind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/properties">Browse Properties</Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
                >
                  <Link href="/auth/register">Create Free Account</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
