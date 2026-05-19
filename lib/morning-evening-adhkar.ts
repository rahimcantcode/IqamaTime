import { DhikrDetail } from './dhikr-data'

const AYAT_AL_KURSI_ARABIC = 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ'

const THREE_QULS_ARABIC = 'قُلْ هُوَ اللهُ أَحَدٌ، اللهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ\n\nقُلْ أَعُوذُ بِرَبِّ الفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي العُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ\n\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الوَسْوَاسِ الخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الجِنَّةِ وَالنَّاسِ'

const MORNING_MULK_DUA = {
  arabic: 'أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا اليَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا اليَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الكَسَلِ وَسُوءِ الكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي القَبْرِ',
  transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhal-yawm wa khayra ma ba'dah, wa a'udhu bika min sharri ma fi hadhal-yawm wa sharri ma ba'dah, Rabbi a'udhu bika minal-kasali wa su'il-kibar, Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr",
  translation: 'We have entered the morning and all sovereignty belongs to Allah. Praise is for Allah. None has the right to be worshipped except Allah alone, without partner. His is the dominion and praise, and He is able to do all things. My Lord, I ask You for the good of this day and what follows it, and I seek refuge in You from the evil of this day and what follows it. My Lord, I seek refuge in You from laziness and the weakness of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
}

const SAYYID_AL_ISTIGHFAR = {
  arabic: 'اللَّهُمَّ أَنْتَ رَبِّي، لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  transliteration: "Allahumma anta Rabbi, la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa Anta",
  translation: 'O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I keep Your covenant and promise as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your blessing upon me and I admit my sin, so forgive me, for none forgives sins except You.',
}

const BIKA_ASBAHNA = {
  arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
  transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namut, wa ilaykan-nushur',
  translation: 'O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.',
}

const USHHIDUK_DUA = {
  arabic: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
  transliteration: 'Allahumma inni asbahtu ushhiduk, wa ushhidu hamalata arshik, wa malaikatak, wa jami a khalqik, annaka Antallah, la ilaha illa Anta, wahdaka la sharika lak, wa anna Muhammadan abduka wa rasuluk',
  translation: 'O Allah, I have reached the morning and call upon You, the bearers of Your Throne, Your angels, and all Your creation to witness that You are Allah, none has the right to be worshipped except You alone without partner, and that Muhammad is Your servant and Messenger.',
}

const NIMAH_DUA = {
  arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ، أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الحَمْدُ وَلَكَ الشُّكْرُ',
  transliteration: 'Allahumma ma asbaha bi min ni matin, aw bi ahadin min khalqik, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr',
  translation: 'O Allah, whatever blessing has come to me or to any of Your creation this morning is from You alone, without partner, so to You belongs all praise and to You belongs all thanks.',
}

const AFINI_BADANI = {
  arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ',
  transliteration: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa Anta. Allahumma inni a'udhu bika minal-kufri wal-faqr, wa a'udhu bika min 'adhabil-qabr, la ilaha illa Anta",
  translation: 'O Allah, grant health to my body. O Allah, grant health to my hearing. O Allah, grant health to my sight. None has the right to be worshipped except You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. None has the right to be worshipped except You.',
}

const HASBIYALLAH = {
  arabic: 'حَسْبِيَ اللهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ العَرْشِ العَظِيمِ',
  transliteration: 'Hasbiyallahu la ilaha illa Huwa, alayhi tawakkalt, wa Huwa Rabbul-arshil-azim',
  translation: 'Allah is sufficient for me. None has the right to be worshipped except Him. Upon Him I rely, and He is Lord of the magnificent Throne.',
}

const AFIYAH_DUA = {
  arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ. اللَّهُمَّ إِنِّي أَسْأَلُكَ العَفْوَ وَالعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي. اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي. اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
  transliteration: "Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah. Allahumma inni as'alukal-'afwa wal-'afiyata fi dini wa dunyaya wa ahli wa mali. Allahummas-tur 'awrati, wa amin raw'ati. Allahummah-fazni min bayni yadayya, wa min khalfi, wa 'an yamini, wa 'an shimali, wa min fawqi, wa a'udhu bi'azamatika an ughtala min tahti",
  translation: 'O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, worldly life, family, and wealth. O Allah, cover my faults and calm my fears. O Allah, protect me from in front of me, behind me, my right, my left, and above me, and I seek refuge in Your greatness from being taken unexpectedly from beneath me.',
}

const FATIR_DUA = {
  arabic: 'اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ',
  transliteration: "Allahumma 'Alimal-ghaybi wash-shahadah, Fatiras-samawati wal-ard, Rabba kulli shay'in wa malikah, ash-hadu an la ilaha illa Anta, a'udhu bika min sharri nafsi, wa min sharrish-shaytani wa shirkih, wa an aqtarifa 'ala nafsi su'an aw ajurrahu ila Muslim",
  translation: 'O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Owner of everything. I testify that none has the right to be worshipped except You. I seek refuge in You from the evil of myself, from the evil of Shaytan and his shirk, and from bringing harm upon myself or upon another Muslim.',
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

const YA_HAYYU = {
  arabic: 'يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
  transliteration: 'Ya Hayyu ya Qayyum, bi rahmatika astaghith, aslih li shani kullah, wa la takilni ila nafsi tarfata ayn',
  translation: 'O Ever-Living, O Self-Sustaining and Supporter of all, by Your mercy I seek assistance. Rectify all of my affairs and do not leave me to myself even for the blink of an eye.',
}

const MORNING_RABBIL_ALAMIN = {
  arabic: 'أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ رَبِّ العَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا اليَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
  transliteration: "Asbahna wa asbahal-mulku lillahi Rabbil-'alamin. Allahumma inni as'aluka khayra hadhal-yawm: fathahu, wa nasrahu, wa nurahu, wa barakatahu, wa hudahu, wa a'udhu bika min sharri ma fihi wa sharri ma ba'dah",
  translation: 'We have entered the morning and all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day: its opening, victory, light, blessing, and guidance. I seek refuge in You from the evil within it and the evil after it.',
}

const FITRAH_DUA = {
  arabic: 'أَصْبَحْنَا عَلَى فِطْرَةِ الإِسْلَامِ، وَعَلَى كَلِمَةِ الإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفًا مُسْلِمًا، وَمَا كَانَ مِنَ المُشْرِكِينَ',
  transliteration: "Asbahna 'ala fitratil-Islam, wa 'ala kalimatil-ikhlas, wa 'ala dini Nabiyyina Muhammad, wa 'ala millati abina Ibrahim, hanifan Musliman, wa ma kana minal-mushrikin",
  translation: 'We have entered the morning upon the natural religion of Islam, the word of pure faith, the religion of our Prophet Muhammad ﷺ, and the way of our father Ibrahim, upright and Muslim, and he was not among the polytheists.',
}

const TAHLIL = {
  arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
  transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
  translation: 'None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things.',
}

const TASBIH_ADADA = {
  arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
  transliteration: 'SubhanAllahi wa bihamdih, adada khalqih, wa rida nafsih, wa zinata arshih, wa midada kalimatih',
  translation: 'Glory and praise be to Allah by the number of His creation, by His pleasure, by the weight of His Throne, and by the ink of His words.',
}

const ILM_RIZQ_AMAL = {
  arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
  transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
  translation: 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
}

const ISTIGHFAR_100 = {
  arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
  transliteration: 'Astaghfirullaha wa atubu ilayh',
  translation: 'I seek Allah’s forgiveness and turn to Him in repentance.',
}

const SALAWAT_10 = {
  arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  transliteration: 'Allahumma salli wa sallim ala Nabiyyina Muhammad',
  translation: 'O Allah, send prayers and peace upon our Prophet Muhammad ﷺ.',
}

export const MORNING_ADHKAR_DETAIL: DhikrDetail = {
  title: 'Morning Adhkar',
  description: 'Words of remembrance for morning',
  sequence: [
    { id: 'morning-seq-quran', title: 'Quran protection', description: 'Ayat al-Kursi, then al-Ikhlas, al-Falaq, and an-Nas.', tag: '1x / 3x' },
    { id: 'morning-seq-core', title: 'Morning duas', description: 'Begin the morning with the core Sunnah duas.', tag: '1x' },
    { id: 'morning-seq-protection', title: 'Protection and wellbeing', description: 'Read the protection duas with their specific counts.', tag: '3x / 7x' },
    { id: 'morning-seq-dhikr', title: 'Tasbih, tahlil, istighfar, salawat', description: 'Complete the longer counted remembrances.', tag: '10x / 100x' },
  ],
  items: [
    { id: 'morning-ayat-kursi', arabic: AYAT_AL_KURSI_ARABIC, transliteration: 'Ayat al-Kursi, al-Baqarah 2:255', translation: 'Allah, there is no deity except Him, the Ever-Living, the Sustainer of all existence. Recite Ayat al-Kursi once in the morning.', targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-three-quls', arabic: THREE_QULS_ARABIC, transliteration: 'Surat al-Ikhlas, Surat al-Falaq, and Surat an-Nas', translation: 'Recite each of the three protective surahs three times in the morning.', targetCount: 3, accent: '#4F6F52' },
    { id: 'morning-mulk-lillah', ...MORNING_MULK_DUA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-bika-asbahna', ...BIKA_ASBAHNA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-sayyid-istighfar', ...SAYYID_AL_ISTIGHFAR, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-ushhiduk', ...USHHIDUK_DUA, targetCount: 4, accent: '#4F6F52' },
    { id: 'morning-nimah', ...NIMAH_DUA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-afini-badani', ...AFINI_BADANI, targetCount: 3, accent: '#4F6F52' },
    { id: 'morning-hasbiyallah', ...HASBIYALLAH, targetCount: 7, accent: '#4F6F52' },
    { id: 'morning-afiyah', ...AFIYAH_DUA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-fatir', ...FATIR_DUA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-bismillah', ...BISMILLAH_PROTECTION, targetCount: 3, accent: '#4F6F52' },
    { id: 'morning-raditu', ...RADITU_DUA, targetCount: 3, accent: '#4F6F52' },
    { id: 'morning-ya-hayyu', ...YA_HAYYU, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-rabbil-alamin', ...MORNING_RABBIL_ALAMIN, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-fitrah', ...FITRAH_DUA, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-subhanallah-bihamdih', arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', transliteration: 'SubhanAllahi wa bihamdih', translation: 'Glory and praise be to Allah.', targetCount: 100, accent: '#4F6F52' },
    { id: 'morning-tahlil-10', ...TAHLIL, translation: `${TAHLIL.translation} Recite ten times, or once if needed.`, targetCount: 10, accent: '#4F6F52' },
    { id: 'morning-tahlil-100', ...TAHLIL, translation: `${TAHLIL.translation} Recite one hundred times in the morning.`, targetCount: 100, accent: '#4F6F52' },
    { id: 'morning-tasbih-adada', ...TASBIH_ADADA, targetCount: 3, accent: '#4F6F52' },
    { id: 'morning-ilm-rizq-amal', ...ILM_RIZQ_AMAL, targetCount: 1, accent: '#4F6F52' },
    { id: 'morning-istighfar-100', ...ISTIGHFAR_100, targetCount: 100, accent: '#4F6F52' },
    { id: 'morning-salawat-10', ...SALAWAT_10, targetCount: 10, accent: '#4F6F52' },
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
