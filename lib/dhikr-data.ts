export interface DhikrCard {
  id: string
  title: string
  description: string
  icon: string
}

export interface DhikrSection {
  title: string
  cards: DhikrCard[]
}

export interface RepeatableItem {
  id: string
  arabic?: string
  transliteration: string
  translation: string
  targetCount: number
  accent: '#C8A951' | '#4F6F52'
}

export interface DhikrDetail {
  title: string
  description: string
  items: RepeatableItem[]
}

export const DHIKR_HERO_CARD: DhikrCard = {
  id: 'post-salah',
  title: 'Post-Salah Dhikr',
  description: 'Tasbih, Ayat al-Kursi, and remembrances after prayer',
  icon: 'Sparkles',
}

export const DHIKR_SECTIONS: DhikrSection[] = [
  {
    title: 'Prayer Moments',
    cards: [
      { id: 'before-salah',  title: 'Before Salah',  description: 'Opening duas and preparation for prayer', icon: 'Sunset' },
      { id: 'inside-salah',  title: 'Inside Salah',  description: 'Recitations within the prayer',           icon: 'Heart'  },
      { id: 'before-salam',  title: 'Before Salam',  description: 'Duas said before completing the prayer',  icon: 'Star'   },
      { id: 'after-salah',   title: 'After Salah',   description: 'Post-prayer tasbih and remembrances',     icon: 'Sparkles' },
    ],
  },
  {
    title: 'Adhan',
    cards: [
      { id: 'reply-to-adhan',         title: 'Reply to Adhan',          description: 'What to say during the call to prayer',   icon: 'Mic'            },
      { id: 'dua-after-adhan',         title: 'Dua After Adhan',         description: 'Supplication after the adhan ends',       icon: 'MessageCircle'  },
      { id: 'between-adhan-iqamah',    title: 'Between Adhan & Iqamah',  description: 'The time for accepted dua',               icon: 'Clock'          },
    ],
  },
  {
    title: 'Masjid',
    cards: [
      { id: 'going-to-masjid',   title: 'Going to Masjid',   description: 'Dua when leaving for the mosque',    icon: 'Navigation' },
      { id: 'entering-masjid',   title: 'Entering Masjid',   description: 'Dua when entering the masjid',       icon: 'LogIn'      },
      { id: 'leaving-masjid',    title: 'Leaving Masjid',    description: 'Dua when leaving the masjid',        icon: 'LogOut'     },
    ],
  },
  {
    title: 'Daily',
    cards: [
      { id: 'morning',    title: 'Morning Adhkar',  description: 'Morning remembrances after Fajr',   icon: 'Sun'    },
      { id: 'evening',    title: 'Evening Adhkar',  description: 'Evening remembrances after Asr',    icon: 'Moon'   },
      { id: 'core-dhikr', title: 'Core Dhikr',      description: 'Essential dhikr for every day',     icon: 'Heart'  },
    ],
  },
  {
    title: 'Special',
    cards: [
      { id: 'istikhara',  title: 'Istikhara',     description: 'Prayer for seeking guidance',         icon: 'Compass' },
      { id: 'janazah',    title: 'Janazah Dua',   description: 'Supplication for the deceased',       icon: 'Shield'  },
      { id: 'eid-takbir', title: 'Eid Takbir',    description: 'Takbir for Eid days',                 icon: 'Star'    },
      { id: 'travel',     title: 'Travel Dua',    description: 'Dua when beginning a journey',        icon: 'Plane'   },
    ],
  },
]

// Only verified Arabic content already present in the original DHIKR_LIST
export const DHIKR_DETAIL_CONTENT: Record<string, DhikrDetail> = {
  'post-salah': {
    title: 'Post-Salah Dhikr',
    description: 'Remembrances after completing the prayer',
    items: [
      {
        id: 'subhanallah',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'alhamdulillah',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is due to Allah',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'allahuakbar',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
        targetCount: 34,
        accent: '#C8A951',
      },
    ],
  },

  morning: {
    title: 'Morning Adhkar',
    description: 'Begin the day with remembrance of Allah',
    items: [
      {
        id: 'morning-asbahna',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
        transliteration: 'Asbahna wa asbahal mulku lillah',
        translation: 'We have entered the morning and all sovereignty belongs to Allah',
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'morning-placeholder-2',
        transliteration: 'Morning dhikr · placeholder',
        translation: 'Content being prepared with care',
        targetCount: 3,
        accent: '#4F6F52',
      },
      {
        id: 'morning-placeholder-3',
        transliteration: 'Morning dhikr · placeholder',
        translation: 'Content being prepared with care',
        targetCount: 7,
        accent: '#4F6F52',
      },
    ],
  },

  evening: {
    title: 'Evening Adhkar',
    description: 'Close the day with remembrance of Allah',
    items: [
      {
        id: 'evening-amsayna',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
        transliteration: 'Amsayna wa amsal mulku lillah',
        translation: 'We have entered the evening and all sovereignty belongs to Allah',
        targetCount: 1,
        accent: '#C8A951',
      },
      {
        id: 'evening-placeholder-2',
        transliteration: 'Evening dhikr · placeholder',
        translation: 'Content being prepared with care',
        targetCount: 3,
        accent: '#C8A951',
      },
      {
        id: 'evening-placeholder-3',
        transliteration: 'Evening dhikr · placeholder',
        translation: 'Content being prepared with care',
        targetCount: 7,
        accent: '#C8A951',
      },
    ],
  },
}
