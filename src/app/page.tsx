'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import {
  Search,
  MapPin,
  Home,
  Building2,
  Users,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Eye,
  Zap,
  Clock,
  IndianRupee,
  Map,
  Phone,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CITIES } from '@/lib/types'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const propertyTypes = [
  { icon: Home, label: 'Houses', count: '2,500+', href: '/properties?property_type=house' },
  { icon: Building2, label: 'Apartments', count: '4,200+', href: '/properties?property_type=apartment' },
  { icon: Users, label: 'PG/Hostels', count: '1,800+', href: '/properties?property_type=pg' },
  { icon: MapPin, label: 'Land/Plots', count: '950+', href: '/properties?property_type=land' },
]

const features = [
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'All properties undergo document verification ensuring authenticity and trust.',
  },
  {
    icon: Phone,
    title: 'Direct Owner Contact',
    description: 'Get owner phone, WhatsApp & email instantly. No middlemen, no brokerage.',
  },
  {
    icon: Eye,
    title: '360° Virtual Tours',
    description: 'Explore properties from your home with immersive virtual reality tours.',
  },
  {
    icon: Map,
    title: 'Interactive Maps',
    description: 'Find properties on map with nearby schools, hospitals, and amenities.',
  },
  {
    icon: TrendingUp,
    title: 'Price Analytics',
    description: 'AI-powered fair market value predictions to help you negotiate better.',
  },
  {
    icon: CreditCard,
    title: 'Affordable Plans',
    description: 'Access owner contacts for just ₹29/day. No hidden fees or commissions.',
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Found 3BHK in Bangalore',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'PropVista helped me find my dream apartment in just 3 days! The verified listings and direct owner contact saved me lakhs in brokerage.',
    rating: 5,
  },
  {
    name: 'Rahul Mehta',
    role: 'Property Owner, Mumbai',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    content: 'As an owner, I love the analytics dashboard. I can see how many people viewed my property and track engagement in real-time.',
    rating: 5,
  },
  {
    name: 'Anjali Patel',
    role: 'Rented PG in Pune',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    content: 'The ₹29 day pass was perfect for me! I contacted 5 PG owners and found the perfect place near my college within hours.',
    rating: 5,
  },
]

const pricingPlans = [
  {
    name: 'Day Pass',
    price: '29',
    period: 'day',
    features: ['5 property contacts', 'Basic search filters', 'Chat with owners', '24 hours access'],
    popular: false,
  },
  {
    name: 'Weekly Pass',
    price: '99',
    period: 'week',
    features: ['20 property contacts', 'Advanced filters', 'Priority support', 'Save favorites', '7 days access'],
    popular: true,
  },
  {
    name: 'Monthly Pass',
    price: '299',
    period: 'month',
    features: ['Unlimited contacts', 'All premium filters', 'Price insights', 'Download PDFs', '30 days access'],
    popular: false,
  },
]

const stats = [
  { value: '50K+', label: 'Properties Listed' },
  { value: '2L+', label: 'Happy Customers' },
  { value: '20+', label: 'Cities Covered' },
  { value: '₹0', label: 'Brokerage Fee' },
]

const featuredCities = [
  { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400', properties: '12,500+' },
  { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400', properties: '9,800+' },
  { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400', properties: '8,200+' },
  { name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=400', properties: '6,500+' },
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCity) params.set('city', selectedCity)
    router.push(`/properties?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Zero Brokerage Property Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Find Your{' '}
              <span className="text-gradient font-serif italic">Perfect</span>
              <br />
              Home Today
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Connect directly with property owners. No brokers, no hidden fees.
              Get owner contact for just <span className="text-primary font-semibold">₹29</span>.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="bg-card rounded-2xl shadow-xl p-4 sm:p-6 max-w-3xl mx-auto border"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by location, property type..."
                    className="pl-12 h-12 sm:h-14 text-base border-0 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <select
                    className="h-12 sm:h-14 pl-12 pr-8 rounded-lg border-0 bg-muted/50 appearance-none cursor-pointer w-full sm:w-48"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <Button size="lg" className="h-12 sm:h-14 px-8" onClick={handleSearch}>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {['2 BHK in Mumbai', 'PG in Bangalore', 'Flat for rent Delhi'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term)
                      handleSearch()
                    }}
                    className="text-sm px-3 py-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="flex flex-wrap justify-center gap-8 mt-16"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {propertyTypes.map((type) => (
              <motion.div key={type.label} variants={fadeIn}>
                <Link
                  href={type.href}
                  className="group block p-6 sm:p-8 bg-card rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <type.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{type.label}</h3>
                  <p className="text-muted-foreground">{type.count} listings</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-4">Why Choose PropVista</Badge>
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="text-gradient font-serif italic">Find Your Home</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We&apos;ve built India&apos;s most transparent property platform with features designed to make your search effortless.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="p-6 sm:p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-4">Popular Destinations</Badge>
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Explore Properties in
              <br />
              <span className="text-gradient font-serif italic">Top Cities</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredCities.map((city) => (
              <motion.div key={city.name} variants={fadeIn}>
                <Link
                  href={`/properties?city=${city.name}`}
                  className="group relative block h-80 rounded-2xl overflow-hidden"
                >
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                    <p className="text-white/80">{city.properties} properties</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-4">Simple Pricing</Badge>
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Affordable Plans for
              <br />
              <span className="text-gradient font-serif italic">Everyone</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Pay only when you need to contact property owners. No subscription traps.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeIn}
                className={`relative p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground scale-105 shadow-2xl'
                    : 'bg-card border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-background text-foreground">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <IndianRupee className="w-6 h-6" />
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                    /{plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                      <span className={plan.popular ? 'text-primary-foreground/90' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full ${plan.popular ? 'bg-background text-foreground hover:bg-background/90' : ''}`}
                  variant={plan.popular ? 'secondary' : 'default'}
                >
                  <Link href="/pricing">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="outline" className="mb-4">Testimonials</Badge>
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Loved by Thousands of
              <br />
              <span className="text-gradient font-serif italic">Happy Customers</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeIn}
                className="p-8 rounded-2xl bg-card border"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Find Your Dream Home?
            </motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-primary-foreground/80 mb-10">
              Join over 2 lakh happy customers who found their perfect property on PropVista.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/properties">
                  Browse Properties
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                <Link href="/auth/register?role=owner">
                  List Your Property Free
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
