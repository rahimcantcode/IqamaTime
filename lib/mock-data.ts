import { Masjid, MasjidWithPrayers } from '@/types'

export const MOCK_MASJIDS: Masjid[] = [
  { id: '1', name: 'Islamic Center of Rowlett', city: 'Rowlett', website_url: 'https://icrmasjid.org', active: true, created_at: '' },
  { id: '2', name: 'EPIC Masjid',               city: 'Plano',   website_url: 'https://epicmasjid.org', active: true, created_at: '' },
  { id: '3', name: 'American Imams Academy',    city: 'Richardson', website_url: 'https://imamsacademy.org', active: true, created_at: '' },
  { id: '4', name: 'SMS Masjid of Sachse',      city: 'Sachse',  website_url: 'https://sachsemasjid.org', active: true, created_at: '' },
  { id: '5', name: 'Valley Ranch Islamic Center', city: 'Irving', website_url: 'https://vric.org', active: true, created_at: '' },
  { id: '6', name: 'Qalam Institute',           city: 'Richardson', website_url: 'https://qalamcampus.org', active: true, created_at: '' },
  { id: '7', name: 'Islamic Assoc. of Collin County', city: 'Plano', website_url: 'https://planomasjid.org', active: true, created_at: '' },
  { id: '8', name: 'Masjid Yaseen',             city: 'Garland', website_url: 'https://masjidyaseen.org', active: true, created_at: '' },
  { id: '9', name: 'IANT',                      city: 'Richardson', website_url: 'https://iant.com', active: true, created_at: '' },
  { id: '10', name: 'Islamic Center of Irving', city: 'Irving',  website_url: 'https://irvingmasjid.org', active: true, created_at: '' },
]

const today = new Date().toISOString().split('T')[0]

export const MOCK_PRAYER_TIMES: MasjidWithPrayers[] = [
  {
    ...MOCK_MASJIDS[0],
    prayer_times: {
      id: '1', masjid_id: '1', date: today,
      fajr: '5:47 AM', dhuhr: '1:30 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: '3:00 PM', scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[1],
    prayer_times: {
      id: '2', masjid_id: '2', date: today,
      fajr: '5:45 AM', dhuhr: '1:45 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:45 PM', jummah2: '3:15 PM', scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[2],
    prayer_times: {
      id: '3', masjid_id: '3', date: today,
      fajr: '5:50 AM', dhuhr: '1:30 PM', asr: '5:20 PM', maghrib: '8:06 PM', isha: '9:35 PM',
      jummah1: '1:30 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[3],
    prayer_times: {
      id: '4', masjid_id: '4', date: today,
      fajr: '5:52 AM', dhuhr: '1:30 PM', asr: '5:15 PM', maghrib: '8:05 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[4],
    prayer_times: {
      id: '5', masjid_id: '5', date: today,
      fajr: '5:48 AM', dhuhr: '1:30 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: '3:00 PM', scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[5],
    prayer_times: {
      id: '6', masjid_id: '6', date: today,
      fajr: '5:45 AM', dhuhr: '2:00 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:45 PM',
      jummah1: '2:00 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[6],
    prayer_times: {
      id: '7', masjid_id: '7', date: today,
      fajr: '5:47 AM', dhuhr: '1:45 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:45 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[7],
    prayer_times: {
      id: '8', masjid_id: '8', date: today,
      fajr: '5:50 AM', dhuhr: '1:30 PM', asr: '5:20 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[8],
    prayer_times: {
      id: '9', masjid_id: '9', date: today,
      fajr: '5:45 AM', dhuhr: '1:30 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: '3:00 PM', scraped_at: new Date().toISOString(), source_url: null,
    },
  },
  {
    ...MOCK_MASJIDS[9],
    prayer_times: {
      id: '10', masjid_id: '10', date: today,
      fajr: '5:47 AM', dhuhr: '1:30 PM', asr: '5:15 PM', maghrib: '8:06 PM', isha: '9:30 PM',
      jummah1: '1:30 PM', jummah2: null, scraped_at: new Date().toISOString(), source_url: null,
    },
  },
]
