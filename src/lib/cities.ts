import { City } from 'country-state-city'

const INDIA_CODE = 'IN'

export interface CityOption {
  name: string
  stateCode: string
  countryCode: string
}

let cachedCities: CityOption[] | null = null

/**
 * Get all Indian cities from country-state-city (free package).
 * Cached for performance.
 */
export function getIndianCities(): CityOption[] {
  if (cachedCities) return cachedCities
  const list = City.getCitiesOfCountry(INDIA_CODE) ?? []
  cachedCities = list.map((c) => ({
    name: c.name,
    stateCode: c.stateCode ?? '',
    countryCode: c.countryCode ?? INDIA_CODE,
  }))
  return cachedCities
}
