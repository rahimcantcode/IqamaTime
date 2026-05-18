import { DhikrDetail } from './dhikr-data'

const THREE_QULS_ARABIC = 'قُلْ هُوَ اللهُ أَحَدٌ، اللهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ\n\nقُلْ أَعُوذُ بِرَبِّ الفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي العُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ\n\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الوَسْوَاسِ الخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الجِنَّةِ وَالنَّاسِ'

const SAYYID_AL_ISTIGHFAR = {
  arabic: 'اللَّهُمَّ أَنْتَ رَبِّي، لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  transliteration: "Allahumma anta Rabbi, la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa Anta",
  translation: 'O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I keep Your covenant and promise as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your blessing upon me and I admit my sin, so forgive me, for none forgives sins except You.',
}

const AFIYAH_DUA = {
  arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ. اللَّهُمَّ إِنِّي أَسْأَلُكَ العَفْوَ وَالعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي. اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي. اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
  transliteration: "Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah. Allahumma inni as'alukal-'afwa wal-'afiyata fi dini wa dunyaya wa ahli wa mali. Allahummas-tur 'awrati, wa amin raw'ati. Allahummah-fazni min bayni yadayya, wa min khalfi, wa 'an yamini, wa 'an shimali, wa min fawqi, wa a'udhu bi'azamatika an ughtala min tahti",
  translation: 'O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, worldly life, family, and wealth. O Allah, cover my faults and calm my fears. O Allah, protect me from in front of me, behind me, my right, my left, and above me, and I seek refuge in Your greatness from being taken unexpectedly from beneath me.',
}

const FATIR_DUA = {
  arabic: 'اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ، عَالِمَ الغَيْبِ وَالشَّهَادَةِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ',
  transliteration: "Allahumma Fatiras-samawati wal-ard, 'Alimal-ghaybi wash-shahadah, Rabba kulli shay'in wa malikah, ash-hadu an la ilaha illa Anta, a'udhu bika min sharri nafsi, wa min sharrish-shaytani wa shirkih, wa an aqtarifa 'ala nafsi su'an aw ajurrahu ila Muslim",
  translation: 'O Allah, Creator of the heavens and the earth, Knower of the unseen and the seen, Lord and Owner of everything. I testify that none has the right to be worshipped except You. I seek refuge in You from the evil of myself, from the evil of Shaytan and his shirk, and from bringing harm upon myself or upon another Muslim.',
}

const BISMILLAH_PROTECTION = {
  arabic: 'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ العَلِيمُ',
  transliteration: "Bismillahil-ladhi la yadurru ma'a ismihi shay'un fil-ardi wa la fis-sama'i, wa Huwas-Sami'ul-'Alim",
  translation: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, All-Knowing.',
}

const RADITU_DUA = {
  arabic: 'رَضِيتُ بِاللهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا',
  transliteration: 'Raditu billahi Rabban, wa bil-Islami dinan, wa bi Muhammadin nabiyya',
  translation: 'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad ﷺ as my Prophet.',
}

const TAHLIL = {
  arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
  translation: 'None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.',
}

export const MORNING_ADHKAR_DETAIL: DhikrDetail = {
  title: 'Morning Adhkar',
  description: 'Authentic morning remembrances from the Quran and Sunnah',
  sequence: [
    { id: 'morning-seq-quls', title: 'Three Quls', description: 'Al-Ikhlas, al-Falaq, and an-Nas.', tag: '3x' },
    { id: 'morning-seq-repentance', title: 'Repentance and contentment', description: 'Sayyid al-Istighfar and Raditu billahi Rabban.', tag: '1x each' },
    { id: 'morning-seq-protection', title: 'Protection adhkar', description: 'Afiyah, Fatir as-samawat, and Bismillahilladhi la yadurr.', tag: '1x / 1x / 3x' },
    { id: 'morning-seq-dhikr', title: 'Tahlil and tasbih', description: 'La ilaha illallah, then SubhanAllahi wa bihamdih.', tag: '1x / 100x' },
  ],
  items: [
    {
      id: 'morning-three-quls',
      arabic: THREE_QULS_ARABIC,
      transliteration: 'Surat al-Ikhlas, Surat al-Falaq, and Surat an-Nas',
      translation: 'Recite each of the three protective surahs three times in the morning.',
      targetCount: 3,
      accent: '#4F6F52',
    },
    {
      id: 'morning-sayyid-istighfar',
      ...SAYYID_AL_ISTIGHFAR,
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-raditu',
      ...RADITU_DUA,
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-bika-asbahna',
      arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
      transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namut, wa ilaykan-nushur',
      translation: 'O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.',
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-mulk-lillah',
      arabic: 'أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا اليَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا اليَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الكَسَلِ وَسُوءِ الكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي القَبْرِ',
      transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhal-yawm wa khayra ma ba'dah, wa a'udhu bika min sharri ma fi hadhal-yawm wa sharri ma ba'dah, Rabbi a'udhu bika minal-kasali wa su'il-kibar, Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr",
      translation: 'We have entered the morning and all sovereignty belongs to Allah. Praise is for Allah. None has the right to be worshipped except Allah alone, without partner. His is the dominion and praise, and He is able to do all things. My Lord, I ask You for the good of this day and what follows it, and I seek refuge in You from the evil of this day and what follows it. My Lord, I seek refuge in You from laziness and the weakness of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-afiyah',
      ...AFIYAH_DUA,
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-fatir',
      ...FATIR_DUA,
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-bismillah',
      ...BISMILLAH_PROTECTION,
      targetCount: 3,
      accent: '#4F6F52',
    },
    {
      id: 'morning-la-ilaha',
      ...TAHLIL,
      targetCount: 1,
      accent: '#4F6F52',
    },
    {
      id: 'morning-subhanallah-bihamdih',
      arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
      transliteration: 'SubhanAllahi wa bihamdih',
      translation: 'Glory and praise be to Allah.',
      targetCount: 100,
      accent: '#4F6F52',
    },
  ],
}

export const EVENING_ADHKAR_DETAIL: DhikrDetail = {
  title: 'Evening Adhkar',
  description: 'Authentic evening remembrances from the Quran and Sunnah',
  sequence: [
    { id: 'evening-seq-quls', title: 'Three Quls', description: 'Al-Ikhlas, al-Falaq, and an-Nas.', tag: '3x' },
    { id: 'evening-seq-repentance', title: 'Repentance and contentment', description: 'Sayyid al-Istighfar and Raditu billahi Rabban.', tag: '1x each' },
    { id: 'evening-seq-protection', title: 'Protection adhkar', description: 'Afiyah, Fatir as-samawat, and Bismillahilladhi la yadurr.', tag: '1x / 1x / 3x' },
    { id: 'evening-seq-dhikr', title: 'Tahlil and tasbih', description: 'La ilaha illallah, then SubhanAllahi wa bihamdih.', tag: '1x / 100x' },
  ],
  items: [
    {
      id: 'evening-three-quls',
      arabic: THREE_QULS_ARABIC,
      transliteration: 'Surat al-Ikhlas, Surat al-Falaq, and Surat an-Nas',
      translation: 'Recite each of the three protective surahs three times in the evening.',
      targetCount: 3,
      accent: '#C8A951',
    },
    {
      id: 'evening-sayyid-istighfar',
      ...SAYYID_AL_ISTIGHFAR,
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-raditu',
      ...RADITU_DUA,
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-bika-amsayna',
      arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
      transliteration: 'Allahumma bika amsayna, wa bika nahya, wa bika namut, wa ilaykan-nushur',
      translation: 'O Allah, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.',
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-mulk-lillah',
      arabic: 'أَمْسَيْنَا وَأَمْسَى المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الكَسَلِ وَسُوءِ الكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي القَبْرِ',
      transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhihil-laylah wa khayra ma ba'daha, wa a'udhu bika min sharri ma fi hadhihil-laylah wa sharri ma ba'daha, Rabbi a'udhu bika minal-kasali wa su'il-kibar, Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr",
      translation: 'We have entered the evening and all sovereignty belongs to Allah. Praise is for Allah. None has the right to be worshipped except Allah alone, without partner. His is the dominion and praise, and He is able to do all things. My Lord, I ask You for the good of this night and what follows it, and I seek refuge in You from the evil of this night and what follows it. My Lord, I seek refuge in You from laziness and the weakness of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-afiyah',
      ...AFIYAH_DUA,
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-fatir',
      ...FATIR_DUA,
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-bismillah',
      ...BISMILLAH_PROTECTION,
      targetCount: 3,
      accent: '#C8A951',
    },
    {
      id: 'evening-la-ilaha',
      ...TAHLIL,
      targetCount: 1,
      accent: '#C8A951',
    },
    {
      id: 'evening-subhanallah-bihamdih',
      arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
      transliteration: 'SubhanAllahi wa bihamdih',
      translation: 'Glory and praise be to Allah.',
      targetCount: 100,
      accent: '#C8A951',
    },
  ],
}
