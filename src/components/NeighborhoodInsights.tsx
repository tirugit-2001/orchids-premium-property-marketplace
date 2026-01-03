'use client'

import { 
  School, 
  Hospital, 
  Utensils, 
  ShoppingBag, 
  Train, 
  Wind, 
  Volume2, 
  Footprints,
  Star,
  MapPin
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface NeighborhoodInsightsProps {
  city: string
  address: string
}

const nearbyPlaces = [
  { icon: School, name: 'St. Xavier High School', distance: '0.8 km', rating: 4.5 },
  { icon: Hospital, name: 'City Care Hospital', distance: '1.2 km', rating: 4.2 },
  { icon: Utensils, name: 'The Gourmet Kitchen', distance: '0.4 km', rating: 4.8 },
  { icon: ShoppingBag, name: 'Global Mall', distance: '1.5 km', rating: 4.4 },
  { icon: Train, name: 'Central Metro Station', distance: '0.9 km', rating: 4.0 },
]

const scores = [
  { label: 'Safety', value: 85, color: 'bg-green-500' },
  { label: 'Air Quality', value: 70, color: 'bg-blue-500' },
  { label: 'Walkability', value: 92, color: 'bg-orange-500' },
  { label: 'Noise Level', value: 40, color: 'bg-red-500', reverse: true },
]

export function NeighborhoodInsights({ city, address }: NeighborhoodInsightsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Neighborhood Insights</h2>
        <p className="text-muted-foreground mb-6">Explore nearby amenities and neighborhood scores for {address}, {city}.</p>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scores.map((score) => (
            <div key={score.label} className="p-4 rounded-xl border bg-card">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{score.label}</span>
                <span className="text-sm font-bold">{score.value}/100</span>
              </div>
              <Progress value={score.value} className="h-2" indicatorClassName={score.color} />
              <p className="text-[10px] text-muted-foreground mt-2">
                {score.value > 80 ? 'Excellent' : score.value > 60 ? 'Good' : 'Average'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Nearby Places</h3>
        <div className="space-y-3">
          {nearbyPlaces.map((place) => (
            <div key={place.name} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <place.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{place.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{place.distance} away</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{place.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-muted/30 border border-dashed">
        <div className="flex items-center gap-4 mb-4">
          <Wind className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Live Air Quality</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-4xl font-bold text-blue-600">42</div>
          <div>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-1">Satisfactory</Badge>
            <p className="text-sm text-muted-foreground">Air quality is considered satisfactory, and air pollution poses little or no risk.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
