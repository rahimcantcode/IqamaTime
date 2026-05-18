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

export interface DhikrSequenceItem {
  id: string
  title: string
  description: string
  tag?: string
}

export interface DhikrDetail {
  title: string
  description: string
  sequence?: DhikrSequenceItem[]
  items: RepeatableItem[]
  tasbihGroup?: RepeatableItem[]
  tasbihGroupIndex?: number
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

export const DHIKR_DETAIL_CONTENT: Record<string, DhikrDetail> = {

  'post-salah': {
    title: 'Post-Salah Dhikr',
    description: 'Remembrances after completing the prayer',
    sequence: [
      {
        id: 'sequence-astaghfirullah',
        title: 'Astaghfirullah',
        description: 'Begin by seeking forgiveness three times.',
        tag: '3x',
      },
      {
        id: 'sequence-salam',
        title: 'Allahumma antas-salam',
        description: 'A short remembrance of peace after salam.',
      },
      {
        id: 'sequence-tasbih',
        title: 'Tasbih set',
        description: 'SubhanAllah, Alhamdulillah, and Allahu Akbar with guided counters.',
        tag: '33 / 33 / 34',
      },
      {
        id: 'sequence-ayat-kursi',
        title: 'Ayat al-Kursi',
        description: 'Reviewed Arabic text will be added here later.',
        tag: 'Coming soon',
      },
      {
        id: 'sequence-three-quls',
        title: 'Three Quls',
        description: 'Reviewed Arabic text will be added here later.',
        tag: 'Coming soon',
      },
    ],
    tasbihGroupIndex: 2,
    tasbihGroup: [
      {
        id: 'subhanallah',
        arabic: 'سُبْحَانَ اللهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'alhamdulillah',
        arabic: 'الحَمْدُ للهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is due to Allah',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'allahuakbar',
        arabic: 'اللهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
        targetCount: 34,
        accent: '#C8A951',
      },
    ],
    items: [
      {
        id: 'astaghfirullah',
        arabic: 'أَسْتَغْفِرُ اللهَ',
        transliteration: 'Astaghfirullah',
        translation: "I seek Allah's forgiveness",
        targetCount: 3,
        accent: '#C8A951',
      },
      {
        id: 'allahumma-antas-salam',
        arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ',
        transliteration: "Allahumma antas-salam, wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
        translation: "O Allah, You are Peace and from You comes peace. Blessed are You, Owner of majesty and honor.",
        targetCount: 1,
        accent: '#C8A951',
      },
      {
        id: 'la-ilaha-illallah-post',
        arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
        translation: "None has the right to be worshipped except Allah alone with no partner. His is the dominion and praise, and He is able to do all things.",
        targetCount: 1,
        accent: '#C8A951',
      },
    ],
  },

  'going-to-masjid': {
    title: 'Going to Masjid',
    description: 'Duas when leaving home and walking to the mosque',
    items: [
      {
        id: 'leaving-home',
        arabic: 'بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
        transliteration: "Bismillah, tawakkaltu 'ala Allah, wa la hawla wa la quwwata illa billah",
        translation: "In the name of Allah, I place my trust in Allah, and there is no power nor strength except with Allah.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'walking-to-masjid',
        arabic: 'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا، وَفِي لِسَانِي نُورًا، وَفِي سَمْعِي نُورًا، وَفِي بَصَرِي نُورًا، وَمِنْ فَوْقِي نُورًا، وَمِنْ تَحْتِي نُورًا، وَعَنْ يَمِينِي نُورًا، وَعَنْ شِمَالِي نُورًا، وَمِنْ أَمَامِي نُورًا، وَمِنْ خَلْفِي نُورًا، وَاجْعَلْ فِي نَفْسِي نُورًا، وَأَعْظِمْ لِي نُورًا',
        transliteration: "Allahumma-j'al fi qalbi nuran, wa fi lisani nuran, wa fi sam'i nuran, wa fi basari nuran, wa min fawqi nuran, wa min tahti nuran, wa 'an yamini nuran, wa 'an shimali nuran, wa min amami nuran, wa min khalfi nuran, waj'al fi nafsi nuran, wa a'zim li nuran",
        translation: "O Allah, place light in my heart, on my tongue, in my hearing, in my sight, above me, below me, to my right, to my left, in front of me, behind me, and place light in my soul, and magnify light for me.",
        targetCount: 1,
        accent: '#4F6F52',
      },
    ],
  },

  'entering-masjid': {
    title: 'Entering Masjid',
    description: 'Duas said upon entering the mosque',
    items: [
      {
        id: 'entering-1',
        arabic: 'أَعُوذُ بِاللهِ العَظِيمِ، وَبِوَجْهِهِ الكَرِيمِ، وَسُلْطَانِهِ القَدِيمِ، مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahil-'azim, wa bi-wajhihil-karim, wa sultanihil-qadim, minash-shaytanir-rajim",
        translation: "I seek refuge in Almighty Allah, by His Noble Face and His eternal authority, from the rejected Shaytan.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'entering-2',
        arabic: 'بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ',
        transliteration: "Bismillah, was-salatu was-salamu 'ala Rasulillah",
        translation: "In the name of Allah, peace and blessings be upon the Messenger of Allah.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'entering-3',
        arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
        transliteration: "Allahumma-ftah li abwaba rahmatik",
        translation: "O Allah, open for me the doors of Your mercy.",
        targetCount: 1,
        accent: '#4F6F52',
      },
    ],
  },

  'leaving-masjid': {
    title: 'Leaving Masjid',
    description: 'Dua said when leaving the mosque',
    items: [
      {
        id: 'leaving-masjid-dua',
        arabic: 'بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ، اللَّهُمَّ اعْصِمْنِي مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "Bismillah, was-salatu was-salamu 'ala Rasulillah. Allahumma inni as'aluka min fadlik. Allahumma-'simnī minash-shaytanir-rajim",
        translation: "In the name of Allah, peace and blessings be upon the Messenger of Allah. O Allah, I ask You from Your favor. O Allah, protect me from the rejected Shaytan.",
        targetCount: 1,
        accent: '#4F6F52',
      },
    ],
  },

  'reply-to-adhan': {
    title: 'Reply to Adhan',
    description: 'What to say while the adhan is being called',
    items: [
      {
        id: 'hayya-response',
        arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
        transliteration: "La hawla wa la quwwata illa billah",
        translation: "There is no power nor strength except with Allah — said when the mu'adhin calls Hayya 'alas-salah and Hayya 'alal-falah.",
        targetCount: 2,
        accent: '#C8A951',
      },
      {
        id: 'shahadah-response',
        arabic: 'وَأَنَا أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، رَضِيتُ بِاللهِ رَبًّا، وَبِمُحَمَّدٍ رَسُولًا، وَبِالإِسْلَامِ دِينًا',
        transliteration: "Wa ana ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa anna Muhammadan 'abduhu wa rasuluh, raditu billahi rabban, wa bi Muhammadin rasulan, wa bil-islami dinan",
        translation: "I bear witness that none has the right to be worshipped except Allah alone with no partner, and that Muhammad is His servant and Messenger. I am pleased with Allah as my Lord, Muhammad as my Messenger, and Islam as my religion.",
        targetCount: 1,
        accent: '#C8A951',
      },
    ],
  },

  'dua-after-adhan': {
    title: 'Dua After Adhan',
    description: 'Supplication said after the adhan finishes',
    items: [
      {
        id: 'dua-after-adhan-main',
        arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
        transliteration: "Allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'ath-hu maqaman mahmudan alladhi wa'adtah",
        translation: "O Allah, Lord of this perfect call and established prayer, grant Muhammad the wasilah and virtue, and raise him to the praised station You promised him.",
        targetCount: 1,
        accent: '#C8A951',
      },
    ],
  },

  'between-adhan-iqamah': {
    title: 'Between Adhan & Iqamah',
    description: 'A special time when dua is not rejected',
    items: [
      {
        id: 'adhan-iqamah-reminder',
        arabic: 'فَإِنَّ الدُّعَاءَ حِينَئِذٍ لَا يُرَدُّ',
        transliteration: "Dua between the adhan and iqamah is not rejected",
        translation: "This is a special time — ask Allah for whatever you need. The Prophet ﷺ said dua at this time is not turned away.",
        targetCount: 1,
        accent: '#C8A951',
      },
    ],
  },

  'before-salah': {
    title: 'Before Salah',
    description: 'Opening supplications after saying Allahu Akbar',
    items: [
      {
        id: 'opening-dua-1',
        arabic: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ المَشْرِقِ وَالمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنْ خَطَايَايَ كَمَا يُنَقَّى الثَّوْبُ الأَبْيَضُ مِنَ الدَّنَسِ، اللَّهُمَّ اغْسِلْنِي مِنْ خَطَايَايَ بِالثَّلْجِ وَالمَاءِ وَالبَرَدِ',
        transliteration: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta baynal-mashriqi wal-maghrib. Allahumma naqqini min khatayaya kama yunaqqath-thawbul-abyadu minad-danas. Allahumma-ghsilni min khatayaya bith-thalji wal-ma'i wal-barad",
        translation: "O Allah, distance me from my sins as You have distanced the East from the West. O Allah, cleanse me from my sins as a white garment is cleansed from dirt. O Allah, wash away my sins with snow, water, and hail.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'opening-dua-2',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
        transliteration: "Subhanakallahumma wa bihamdik, wa tabarakasmuk, wa ta'ala jadduk, wa la ilaha ghayruk",
        translation: "Glory is to You, O Allah, and praise. Blessed is Your Name, exalted is Your Majesty, and there is no god besides You.",
        targetCount: 1,
        accent: '#4F6F52',
      },
    ],
  },

  'inside-salah': {
    title: 'Inside Salah',
    description: 'Recitations for each position within the prayer',
    items: [
      {
        id: 'ruku',
        arabic: 'سُبْحَانَ رَبِّيَ العَظِيمِ',
        transliteration: "Subhana Rabbiyal-'Azim",
        translation: "Glory be to my Lord, the Most Great — said in ruku'.",
        targetCount: 3,
        accent: '#4F6F52',
      },
      {
        id: 'rising-from-ruku',
        arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ · رَبَّنَا وَلَكَ الحَمْدُ',
        transliteration: "Sami'allahu liman hamidah · Rabbana wa lakal-hamd",
        translation: "Allah hears the one who praises Him · Our Lord, to You belongs all praise — said when rising from ruku'.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'sujood',
        arabic: 'سُبْحَانَ رَبِّيَ الأَعْلَى',
        transliteration: "Subhana Rabbiyal-A'la",
        translation: "Glory be to my Lord, the Most High — said in sujood.",
        targetCount: 3,
        accent: '#4F6F52',
      },
      {
        id: 'between-prostrations',
        arabic: 'رَبِّ اغْفِرْ لِي',
        transliteration: "Rabbighfir li",
        translation: "My Lord, forgive me — said between the two prostrations.",
        targetCount: 2,
        accent: '#4F6F52',
      },
    ],
  },

  'before-salam': {
    title: 'Before Salam',
    description: 'Duas said in the final tashahhud before completing the prayer',
    items: [
      {
        id: 'before-salam-1',
        arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
        translation: "O Allah, help me remember You, thank You, and worship You in the best way.",
        targetCount: 1,
        accent: '#4F6F52',
      },
      {
        id: 'before-salam-2',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
        transliteration: "Allahumma inni as'alukal-jannah, wa a'udhu bika minan-nar",
        translation: "O Allah, I ask You for Paradise and seek refuge in You from the Fire.",
        targetCount: 1,
        accent: '#4F6F52',
      },
    ],
  },

  'after-salah': {
    title: 'After Salah',
    description: 'General remembrances after completing the prayer',
    items: [
      {
        id: 'after-salah-astaghfirullah',
        arabic: 'أَسْتَغْفِرُ اللهَ',
        transliteration: 'Astaghfirullah',
        translation: "I seek Allah's forgiveness — said three times right after salam.",
        targetCount: 3,
        accent: '#C8A951',
      },
      {
        id: 'after-salah-salam',
        arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ',
        transliteration: "Allahumma antas-salam, wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
        translation: "O Allah, You are Peace and from You comes peace. Blessed are You, Owner of majesty and honor.",
        targetCount: 1,
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

  'core-dhikr': {
    title: 'Core Dhikr',
    description: 'Essential remembrances for every day',
    items: [
      {
        id: 'core-subhanallah',
        arabic: 'سُبْحَانَ اللهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        targetCount: 33,
        accent: '#4F6F52',
      },
      {
        id: 'core-alhamdulillah',
        arabic: 'الحَمْدُ للهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is for Allah',
        targetCount: 33,
        accent: '#4F6F52',
      },
      {
        id: 'core-la-ilaha',
        arabic: 'لَا إِلَهَ إِلَّا اللهُ',
        transliteration: 'La ilaha illallah',
        translation: 'There is no god worthy of worship except Allah',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'core-allahuakbar',
        arabic: 'اللهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
        targetCount: 33,
        accent: '#C8A951',
      },
      {
        id: 'core-astaghfirullah',
        arabic: 'أَسْتَغْفِرُ اللهَ',
        transliteration: 'Astaghfirullah',
        translation: "I seek Allah's forgiveness",
        targetCount: 100,
        accent: '#4F6F52',
      },
      {
        id: 'core-salawat',
        arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
        transliteration: "Allahumma salli wa sallim 'ala nabiyyina Muhammad",
        translation: "O Allah, send peace and blessings upon our Prophet Muhammad.",
        targetCount: 10,
        accent: '#C8A951',
      },
      {
        id: 'core-rabbana-atina',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً، وَفِي الآخِرَةِ حَسَنَةً، وَقِنَا عَذَابَ النَّارِ',
        transliteration: "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaban-nar",
        translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        targetCount: 3,
        accent: '#4F6F52',
      },
    ],
  },

}
