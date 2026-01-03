'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { PropertyCard } from '@/components/PropertyCard'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Favorite, Property } from '@/lib/types'
import {
  Heart,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react'

export default function FavoritesPage() {
  const { user } = useAuthStore()
  const [favorites, setFavorites] = useState<(Favorite & { property: Property })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('favorites')
        .select('*, property:properties(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setFavorites(data as (Favorite & { property: Property })[])
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFavorite = async (propertyId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('property_id', propertyId)

      if (error) throw error
      setFavorites(favorites.filter(f => f.property_id !== propertyId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Saved Properties</h1>
              <p className="text-muted-foreground">
                {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/properties">
                <Search className="w-4 h-4 mr-2" />
                Browse More
              </Link>
            </Button>
          </div>

          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No saved properties yet</h3>
              <p className="text-muted-foreground mb-6">
                Save properties you like and compare them later
              </p>
              <Button asChild>
                <Link href="/properties">Explore Properties</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group"
                >
                  <PropertyCard
                    property={favorite.property}
                    isFavorite={true}
                    onFavorite={() => removeFavorite(favorite.property_id)}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFavorite(favorite.property_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
