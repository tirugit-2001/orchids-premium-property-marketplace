'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getIndianCities } from '@/lib/cities'

interface CityComboboxProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
  heightClass?: string
}

export function CityCombobox({
  value,
  onChange,
  placeholder = 'All Cities',
  className,
  triggerClassName,
  heightClass = 'h-12 sm:h-14',
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const cities = React.useMemo(() => getIndianCities(), [])
  const filtered = React.useMemo(() => {
    if (!search.trim()) return cities.slice(0, 200)
    const q = search.toLowerCase()
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 200)
  }, [cities, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal border-0 bg-muted/50 hover:bg-muted/70 rounded-lg',
            heightClass,
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[var(--radix-popover-trigger-width)] p-0', className)} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city..."
            value={search}
            onValueChange={setSearch}
            className="h-10"
          />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange('')
                  setOpen(false)
                  setSearch('')
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                All Cities
              </CommandItem>
              {filtered.map((city) => (
                <CommandItem
                  key={`${city.name}-${city.stateCode}`}
                  value={city.name}
                  onSelect={() => {
                    onChange(city.name)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === city.name ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="truncate">{city.name}</span>
                  {city.stateCode && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {city.stateCode}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
