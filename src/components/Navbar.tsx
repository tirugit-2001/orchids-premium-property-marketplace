'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Building2,
  Search,
  User,
  LogOut,
  Settings,
  Heart,
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
  Plus,
  Bell,
  CreditCard,
  Shield,
  ShieldCheck,
} from 'lucide-react'

export function Navbar() {
  const { user, subscription, logout, hasActiveSubscription, getRemainingContacts } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
  }

  const remainingContacts = getRemainingContacts()

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">PropVista</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/properties"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Find Properties
                </span>
              </Link>
              <Link
                href="/properties?listing_type=rent"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                Rent
              </Link>
              <Link
                href="/properties?listing_type=sale"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                Buy
              </Link>
              <Link
                href="/properties?property_type=pg"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                PG/Hostel
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                Pricing
              </Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  {user.role === 'customer' && hasActiveSubscription() && (
                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg text-sm">
                      <span className="text-muted-foreground">Contacts: </span>
                      <span className="font-semibold text-primary">
                        {remainingContacts === -1 ? '∞' : remainingContacts}
                      </span>
                    </div>
                  )}
                  
                  {user.role === 'owner' && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/properties/new">
                        <Plus className="w-4 h-4 mr-2" />
                        List Property
                      </Link>
                    </Button>
                  )}

                  {user.role === 'admin' && (
                    <Button asChild variant="default" size="sm">
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </Button>
                  )}

                  <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-muted">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {user.full_name && (
                            <p className="font-medium">{user.full_name}</p>
                          )}
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <Badge variant="secondary" className={`w-fit text-xs capitalize ${
                            user.role === 'admin' ? 'bg-primary/10 text-primary' :
                            user.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                            ''
                          }`}>
                            {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                            {user.role === 'owner' && <Building2 className="w-3 h-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      
                      {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      
                      {user.role === 'owner' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/properties">
                              <Building2 className="mr-2 h-4 w-4" />
                              My Properties
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/verify">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verification
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {user.role === 'customer' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/favorites">
                              <Heart className="mr-2 h-4 w-4" />
                              Favorites
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/pricing">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Subscription
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/messages">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Messages
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-background z-50 lg:hidden shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-lg">Menu</span>
                <button
                  className="p-2 rounded-lg hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                <Link
                  href="/properties"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="w-5 h-5" />
                  Find Properties
                </Link>
                <Link
                  href="/properties?listing_type=rent"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="w-5 h-5" />
                  Rent
                </Link>
                <Link
                  href="/properties?listing_type=sale"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  Buy
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CreditCard className="w-5 h-5" />
                  Pricing
                </Link>
                <div className="border-t my-4" />
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="w-5 h-5" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    {user.role === 'owner' && (
                      <Link
                        href="/dashboard/properties"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Building2 className="w-5 h-5" />
                        My Properties
                      </Link>
                    )}
                    {user.role === 'customer' && (
                      <Link
                        href="/dashboard/favorites"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="w-5 h-5" />
                        Favorites
                      </Link>
                    )}
                    <Link
                      href="/dashboard/messages"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageSquare className="w-5 h-5" />
                      Messages
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted w-full text-left text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
