export interface Masjid {
  id: string
  name: string
  city: string
  website_url: string
  active: boolean
  created_at: string
}

export interface PrayerTimes {
  id: string
  masjid_id: string
  date: string
  fajr: string | null
  dhuhr: string | null
  asr: string | null
  maghrib: string | null
  isha: string | null
  jummah1: string | null
  jummah2: string | null
  jummah3: string | null
  scraped_at: string
  source_url: string | null
}

export interface MasjidWithPrayers extends Masjid {
  prayer_times: PrayerTimes | null
}

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah'

export interface PrayerMeta {
  key: PrayerKey
  displayName: string
  arabicName: string
}

export interface MasjidIqamaTime {
  masjid: Masjid
  iqama: string | null
  iqama2?: string | null
  iqama3?: string | null
  adhan?: string | null
  isPast: boolean
}

export interface PrayerCardData {
  prayer: PrayerMeta
  adhanTime: string | null
  iqamaTimes: MasjidIqamaTime[]
  isFriday: boolean
}

export interface AppSettings {
  selectedMasjidIds: string[]
  theme: 'dark' | 'light'
}

export interface AdhanTimes {
  fajr:    string | null
  dhuhr:   string | null
  asr:     string | null
  maghrib: string | null
  isha:    string | null
}
