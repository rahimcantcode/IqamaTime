export type UpdateEventSource = 'salamdfw' | 'hilalz' | 'manual'
export type UpdateEventStatus = 'approved' | 'needs_review' | 'rejected'

export type UpdateEvent = {
  id: string
  source: UpdateEventSource
  sourceName: string
  sourceUrl: string

  title: string
  description?: string
  shortDescription?: string

  masjidId?: string
  masjidName?: string
  organizer?: string
  locationName?: string
  address?: string

  startDate?: string
  startTimeText?: string
  endTimeText?: string

  imageUrl?: string
  category?: string

  relevanceScore: number
  matchedMasjidAliases: string[]

  status: UpdateEventStatus
  scrapedAt: string
}

export type RawUpdateEventCandidate = {
  source: UpdateEventSource
  sourceName: string
  sourceUrl: string
  title: string
  description?: string
  shortDescription?: string
  organizer?: string
  locationName?: string
  address?: string
  startDate?: string
  startTimeText?: string
  endTimeText?: string
  imageUrl?: string
  category?: string
  scrapedAt?: string
}
