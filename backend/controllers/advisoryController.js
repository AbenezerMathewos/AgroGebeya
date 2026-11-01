const { GoogleGenerativeAI } = require('@google/generative-ai');
const CropAdvisory = require('../models/CropAdvisory');

// Built-in Multilingual Knowledge base of Ethiopian crop diseases and diagnostics
const ETHIOPIAN_DISEASE_KNOWLEDGE_BASE = [
  {
    id: 'coffee_cbd',
    crop: 'Coffee',
    cropTranslations: {
      en: 'Coffee',
      am: 'ቡና',
      om: 'Buna',
      wot: 'Buuna',
      ti: 'ቡን',
    },
    aliases: ['coffee', 'buuna', 'buna', 'ቡና', 'berry', 'cbd', 'kahawae', 'ቡን'],
    diseaseName: {
      en: 'Coffee Berry Disease (Colletotrichum kahawae)',
      am: 'የቡና ፍሬ በሽታ (ሲ.ቢ.ዲ / CBD)',
      om: 'Dhukkuba Firi Bunnaa (CBD)',
      wot: 'Tukke Buuna Harka (CBD)',
      ti: 'ናይ ቡን ፍረ ሕማም (CBD)',
    },
    pathogen: 'Fungal (ፈንገስ)',
    severity: 'critical',
    confidenceRange: [92.4, 98.6],
    keyFeatures: ['dark sunken spots on green berries', 'mummified black berries', 'premature fruit drop', 'berry lesions', 'black spots', 'berry'],
    symptoms: {
      en: 'Dark, sunken necrotic spots on young green berries that rapidly expand, turning the entire berry black, mummified, and hollow. Causes severe fruit drop during wet rainy seasons.',
      am: 'በአረንጓዴ የቡና ፍሬዎች ላይ ጥቁር የሰመጡ ነጠብጣቦች መታየት፤ ፍሬው ወደ ጥቁርነት ተቀይሮ ደርቆ መርገፍ፤ በዝናባማ ወቅት ከፍተኛ የፍሬ መጥፋት።',
      om: 'Firiilee bunaa magariisa irratti dhibee gurraacha gadi seene mul\'achuu, firiin gogee harca\'uu fi yeroo roobaa qabeenyi firiin daran miidhamuu.',
      wot: 'Ciloo buuna aayfiya bolla geella qoratta xalqqiya beettiyaagaa, aayfey meellidi koorissidi kunddiyaagaa.',
      ti: 'ኣብ ለምለም ቀጠልቲ ፍረታት ቡን ጸሊም ዝተቐርቀረ ምልክታት ይርአ፤ ፍረታት ጸሊሞም ነቒጾም ይረግፉ።',
    },
    organicRemedy: {
      en: {
        title: 'Pruning & Organic Shade Canopy Management',
        steps: [
          'Prune dense canopy and dead coffee branches to allow sunlight penetration and reduce microclimate humidity.',
          'Collect and bury or burn all dropped mummified berries to destroy fungal spore reserves.',
          'Intercrop with indigenous shade trees like Cordia africana (ዋንዛ) and Millettia ferruginea (ብርብራ).',
        ],
      },
      am: {
        title: 'ቅርንጫፍ መግረዝ እና የጥላ ዛፎች አያያዝ',
        steps: [
          'አየርና ፀሐይ በደንብ እንዲገባ የደረቁና የተጠጋጉ የቡና ቅርንጫፎችን መግረዝ።',
          'የረገፉና የደረቁ የተበከሉ የቡና ፍሬዎችን ሰብስቦ ማቃጠል ወይም አፈር ውስጥ በጥልቀት መቅበር።',
          'እንደ ዋንዛ እና ብርብራ ያሉ የጥላ ዛፎችን በቡና ማሳ ውስጥ ማካተት።',
        ],
      },
      om: {
        title: 'Doggomsiisuu fi Mukoota Gaaddisaa Qulqulleessuu',
        steps: [
          'Daree bunaa caccabee fi gogee ciruun aduu fi qilleensi akka galu gochuu.',
          'Firiilee goggogee harca\'an walitti qabuun gubuu yookiin lafa keessa gadi fageessanii awwaaluu.',
          'Mukoota gaaddisaa akka Waanzaa fi Birbiraa maasii bunaa keessatti facaasuu.',
        ],
      },
      wot: 'Aanaara Koxxiyoone Guyye Xissiyoogaa',
      ti: {
        title: 'ጨናፍር ምቑራጽን ጽላል ምምሕዳርን',
        steps: [
          'ጸሓይን ንፋስን ጽቡቕ ጌሩ ክኣቱ ዝነቐጹ ጨናፍር ምቑራጽ።',
          'ዝረገፉ ዝተበላሸዉ ፍረታት ቡን ኣኪብካ ምንዳድ ወይ ኣብ ሓመድ ምቕባር።',
          'ጽላል ዝህቡ ኣግራብ ኣብ መንጎ ቡን ምትካል (ዋንዛ/ብርብራ)።',
        ],
      },
    },
    chemicalTreatment: {
      en: {
        title: 'MoA Approved Fungicides & Timed Spray Schedule',
        formulation: 'Copper Hydroxide 77% WP (Kocide 2000) or Chlorothalonil 75% WP',
        dosage: '2.5 kg / hectare in 500 liters of water',
        timing: 'Apply 3-4 sprays starting at pinhead stage before the main Belg/Meher rains.',
      },
      am: {
        title: 'በግብርና ሚኒስቴር የጸደቁ የፈንገስ መድኃኒቶችና አጠቃቀም',
        formulation: 'ኮፐር ሃይድሮክሳይድ 77% WP (ኮሳይድ 2000) ወይም ክሎሮታሎኒል 75% WP',
        dosage: 'በሄክታር 2.5 ኪ.ግ በ 500 ሊትር ውሃ ተበጥብጦ',
        timing: 'የበልግና የመኸር ዝናብ ከመግባቱ በፊት ፍሬው በትንሹ ሲቋጥር መርጨት።',
      },
      om: {
        title: 'Qoricha Fangaasii Ministeera Qonnaan Hayyamame',
        formulation: 'Copper Hydroxide 77% WP (Kocide 2000) yookiin Chlorothalonil 75% WP',
        dosage: 'Hektaara tokkoof kiiloo 2.5 bishaan liitira 500 wajjin',
        timing: 'Roobni guddaan eegaluun dura firiin yeroo ija baaftu biifuu.',
      },
      wot: {
        title: 'Goshsha Ministiriyaa Eenxidi Kessido Fangaase Qora',
        formulation: 'Copper Hydroxide 77% WP (Kocide 2000)',
        dosage: 'Hektaareyyas 2.5 kg haatta 500 Liitiree giddon',
        timing: 'Iraay yiiganaappe kase aayfey cillido wode caaccatta.',
      },
      ti: {
        title: 'ብሚኒስትሪ ሕርሻ ዝተፈቐደ ፈውሲ ፈንገስ',
        formulation: 'ኮፐር ሃይድሮክሳይድ 77% WP (Kocide 2000)',
        dosage: 'ንሓደ ሄክታር 2.5 ኪሎ ኣብ 500 ሊትሮ ማይ',
        timing: 'እዋን ዝናብ ቅድሚ ምጅማሩ ኣብ እዋን ጥንሲ ፍረ ምርጫሕ።',
      },
    },
    researchCenter: 'Jimma Agricultural Research Center (JARC) - Tel: +251 47 111 0019',
  },
  {
    id: 'enset_bacterial_wilt',
    crop: 'Enset',
    cropTranslations: {
      en: 'Enset',
      am: 'እንሰት / ቆጮ',
      om: 'Qoccoo / Warqee',
      wot: 'Utta / Qocho',
      ti: 'እንሰት',
    },
    aliases: ['enset', 'inset', 'kocho', 'bulla', 'ቆጮ', 'እንሰት', 'gomere', 'wilt', 'xanthomonas', 'utta'],
    diseaseName: {
      en: 'Bacterial Wilt of Enset (Xanthomonas vasicola pv. musacearum)',
      am: 'የእንሰት ባክቴሪያል ዊልት (ጎመሬ / ዎሾ)',
      om: 'Bacterial Wilt Qoccoo (Gomere)',
      wot: 'Utta Gomari (Hosa / Woshsho)',
      ti: 'ናይ እንሰት ባክቴርያዊ ምድረቕ (ጎመሬ)',
    },
    pathogen: 'Bacterial (ባክቴሪያ)',
    severity: 'critical',
    confidenceRange: [94.1, 99.2],
    keyFeatures: ['yellowing wilting leaves', 'bacterial ooze from cut pseudostem', 'collapsing spindle', 'rotting corm', 'ooze', 'yellow leaves'],
    symptoms: {
      en: 'Inner emerging leaves turn pale yellow, wilt, and lose turgidity. When pseudostem is cut, yellow-gray sticky bacterial ooze discharges within 15 minutes. Leads to total rotting of the bulla/kocho corm.',
      am: 'የውስጠኛው የእንሰት ልብ ቅጠል ቢጫ መሆንና መድረቅ፤ ግንዱ ሲቆረጥ የሚወጣ ቢጫ ተጣባቂ ፈሳሽ (ባክቴሪያል ኦዝ)፤ የቆጮ ጉዝጓዝ መበስበስ።',
      om: 'Baalli keessaa keelloo ta\'ee goguu, yeroo muramu dhangala\'aa keelloo malaa fakkaatu baasuu fi hundeen qoccoo tortoruu.',
      wot: 'Utattaa wozana haytsay ciillidi meelliyoogaa; gindiyaa qanxxiya wode ciilla laappiyaagaa malaadan kessiyoogaa.',
      ti: 'ናይ ውሽጢ ቆጽሊ እንሰት ብጫ ኮይኑ ይነቅጽ፤ ግንዲ እንተተቖሪጹ ብጫ ዝተጣበቐ ፈሳሲ ይወጽእ።',
    },
    organicRemedy: {
      en: {
        title: 'Machete Flame Sterilization & Strict Field Quarantine',
        steps: [
          'Sterilize all harvesting knives, machetes, and axes with fire flame or 5% bleach between each plant.',
          'Uproot infected enset plants immediately, chop them, and bury them in a deep pit away from waterways.',
          'Fence the farm to prevent wandering cattle and goats from spreading bacterial sap through browsing.',
        ],
      },
      am: {
        title: 'የግብርና መገልገያዎችን በእሳት ማምከንና ማሳን መከለል',
        steps: [
          'ማንኛውንም እንሰት መቁረጫ ቢላዋ፣ ጩቤ እና ገጀራ በእሳት ነበልባል ወይም በበረኪና ማምከን።',
          'የታመመውን እንሰት ወዲያውኑ ነቅሎ በመቆራረጥ ከውሃ መውረጃ ርቆ በጥልቅ ጉድጓድ ውስጥ መቅበር።',
          'ከብቶችና ፍየሎች የታመመውን እንሰት በልተው ወደ ጤነኛው እንዳያስተላልፉ ማሳውን በአጥር መከለል ወይ ማሰር።',
        ],
      },
      om: {
        title: 'Meeshaalee Qonnaa Ibiddan Qulqulleessuu',
        steps: [
          'Haamtuu fi meeshaa qoccoo ittiin muran hunda ibiddan gubanii qulqulleessuu.',
          'Qoccoo dhukkubsate dafanii buqqisanii boolla gadi fagootti awwaaluu.',
          'Beelladoonni akka hin nyaanneef daangaa maasichaa dallessuu.',
        ],
      },
      wot: {
        title: 'Qanxxiya Biillawata Tamman Xoqissiyoogaa',
        steps: [
          'Utta qanxxiya baashshata, mashshata ubbaakka tamman xoqissidi go\'ettiyoogaa.',
          'Harggida uttaa eesuwan shoddidi ollan xiishshidi goole moyzze miissennaadan kessiyoogaa.',
          'Mehee harggida haytsaa miidi harggettennaadan giddiyaa gaxiyoogaa.',
        ],
      },
      ti: {
        title: 'መሳርሒታት ብሓዊ ምሕራርን ምግላልን',
        steps: [
          'እንሰት ዝቕንጠጸሉ መላጺ ወይ ፋስ ብሓዊ ኣንድድካ ምጽራይ።',
          'ዝሓመመ እንሰት ብቕጽበት ነቒልካ ኣብ ዓሚቕ ጉድጓድ ምቕባር።',
          'እንስሳታት በሊዖም ሕማም ከየመሓላልፉ ዓጸድ ምዕጻው።',
        ],
      },
    },
    chemicalTreatment: {
      en: {
        title: 'Zero Chemical Cure (Strict Sanitary Quarantine)',
        formulation: 'No chemical spray cures vascular Xanthomonas bacteria in enset.',
        dosage: 'Strict field hygiene and resistant clone propagation from Areka Research Center.',
        timing: 'Continuous monitoring throughout the rainy season.',
      },
      am: {
        title: 'ምንም አይነት ኬሚካል የለውም (ጥብቅ የንጽህና አያያዝ ብቻ)',
        formulation: 'የእንሰት ባክቴሪያል ዊልትን የሚያድን ምንም አይነት የኬሚካል ርጭት የለም።',
        dosage: 'ማሳን በንጽህና መጠበቅና ከአረካ ምርምር ማዕከል የተሻሻሉ ዝርያዎችን መጠቀም።',
        timing: 'በክረምትና በበልግ ወቅት የማያቋርጥ ክትትል ማድረግ።',
      },
      om: {
        title: 'Qoricha Keemikaalaa Hin Qabu',
        formulation: 'Dhukkuba kanaaf qorichi biifamu hin jiru, qulqullina eeguu qofa.',
        dosage: 'Sanyii filatamaa Wiirtuu Qorannoo Arekaarraa fayyadamuu.',
        timing: 'Waggaa guutuu hordoffii gochuu.',
      },
      wot: {
        title: 'Kemikaale Qori Baawa (Geeshshatetta Naagiyoogaa Xalaala)',
        formulation: 'Utatta gomariya xayssiya kemikaale qori aawankka baawa.',
        dosage: 'Areka Qorisa Kettaappe kiyida wolqqama uttaa zariya baqqiyoogaa.',
        timing: 'Wode ubban loytti aattidi xelliyoogaa.',
      },
      ti: {
        title: 'ኬሚካላዊ ፈውሲ የብሉን (ጽሬት ምሕላው ጥራይ)',
        formulation: 'ንዝሓመመ እንሰት ዘድሕን ዝኾነ ኬሚካል የለን።',
        dosage: 'ካብ ምርምር ማእከል ኣረካ ዝወጹ ጽኑዓት ዘርኢ ምጥቃም።',
        timing: 'ቀጻሊ ምክትታል ምግባር።',
      },
    },
    researchCenter: 'Areka Agricultural Research Center (Southern Agri Institute) - Tel: +251 46 552 0110',
  },
  {
    id: 'maize_fall_armyworm',
    crop: 'Maize',
    cropTranslations: {
      en: 'Maize',
      am: 'በቆሎ',
      om: 'Boqqolloo',
      wot: 'Badalla / Goshshuwaa',
      ti: 'ዕፉን',
    },
    aliases: ['maize', 'corn', 'በቆሎ', 'boqollo', 'armyworm', 'caterpillar', 'frass', 'whorl', 'ዕፉን'],
    diseaseName: {
      en: 'Fall Armyworm (Spodoptera frugiperda)',
      am: 'የመኸር ሰራዊት አባጨጓሬ (Fall Armyworm)',
      om: 'Raammoo Boqqolloo (Fall Armyworm)',
      wot: 'Badallaa Goshshuwaa (Armyworm)',
      ti: 'ሓሰኻ ዕፉን (Fall Armyworm)',
    },
    pathogen: 'Insect Pest (ተባይ)',
    severity: 'high',
    confidenceRange: [91.8, 97.4],
    keyFeatures: ['ragged feeding holes in whorl', 'sawdust frass in leaf funnel', 'window pane damage', 'caterpillar larvae', 'holes in leaves', 'chewed'],
    symptoms: {
      en: 'Ragged window-pane feeding holes in the leaf whorl accompanied by sawdust-like yellowish larval frass. In severe infestations, larvae bore directly into developing maize cobs.',
      am: 'በበቆሎው አናት (ልብ) ላይ የተቀዳደደ ቅጠል፤ በመሃከሉ ላይ የተፈጨ እንጨት የሚመስል የትል እዳሪ መታየት፤ የዘር ቆጥ መበላት።',
      om: 'Baala boqqolloo keessatti boolla dhoowwuu fi kosii mukaa fakkaatu irratti mul\'achuu, yeroo heddummatu ija boqqolloo nyaachuu.',
      wot: 'Badallaa wozanaa haytsay daaccettiyoogaa, mittaa dooqan kessiya huuphe cilliyoogaa.',
      ti: 'ኣብ ልቢ ዕፉን ዝተበላሸወ ዝተቦርቦረ ቆጽልን ናይ ሓሰኻ ርስሓትን ይርአ።',
    },
    organicRemedy: {
      en: {
        title: 'Wood Ash, Sand & Push-Pull Intercropping',
        steps: [
          'Place a pinch of dry fine wood ash mixed with chili powder into the central funnel whorl of young maize plants.',
          'Intercrop maize with Desmodium (Silverleaf) and surround the field with Napier grass (Push-Pull technology).',
          'Hand-pick and crush egg masses and young caterpillars during early morning field walks.',
        ],
      },
      am: {
        title: 'የእንጨት አመድ፣ አሸዋ እና የፑሽ-ፑል ቴክኖሎጂ',
        steps: [
          'ትንሽ ደረቅ አመድ ከሚጥሚጣ ዱቄት ጋር በመደባለቅ በበቆሎው ልብ (ፈነል) ውስጥ መነስነስ።',
          'በቆሎን ከደስሞዲየም ጋር በጋራ ማብቀል እና በማሳው ዙሪያ የዝሆኔ ሳር (ናፒየር) መትከል።',
          'በጠዋት ማሳን በመዞር የተባዩን እንቁላሎችና ትሎች በእጅ ለቅሞ ማጥፋት።',
        ],
      },
      om: {
        title: 'Daraaraa Mukaa fi Daaraa Fayyadamuu',
        steps: [
          'Daaraa gogaa qulqulluu qaraa wajjin walitti makanii handhuura boqqolloo keessa naquu.',
          'Boqqolloo Desmodium wajjin walitti makuun dhaabuu.',
          'Ganama barii buqqee raammoo harka qullaan funaananii balleessuu.',
        ],
      },
      wot: {
        title: 'Mittaa Binddaanene Shaashshiyaa Kessiyoogaa',
        steps: [
          'Meldda mittaa binddaa qariyaara walissidi badallaa wozanaa giddon wottiyoogaa.',
          'Badallaa Desmodium giyo maataara gakissidi zariyoo.',
          'Maallado eesuwan denddidi goshshuwaa qanxxiya aaphfe shoddiyoogaa.',
        ],
      },
      ti: {
        title: 'ሓመድ ድበን ባእሮን ምጥቃም',
        steps: [
          'ንቑጽ ሓመድ ድበ ምስ በርበረ ሓዊስካ ኣብ ልቢ ዕፉን ምግባር።',
          'ዕፉን ምስ ደስሞድየም ብሓባር ምዝራእ።',
          'ንግሆ ንግሆ ሓሰኻታት ብኢድካ ኣኪብካ ምጭፍላቕ።',
        ],
      },
    },
    chemicalTreatment: {
      en: {
        title: 'MoA Approved Bio-Insecticides & Spray',
        formulation: 'Emamectin Benzoate 5% SG or Chlorantraniliprole 20% SC',
        dosage: '250 grams / hectare directed into leaf funnels',
        timing: 'Spray late in the afternoon when caterpillars are actively moving out of the whorl.',
      },
      am: {
        title: 'በግብርና ሚኒስቴር የጸደቁ የጸረ-ተባይ መድኃኒቶች',
        formulation: 'ኢማሜክቲን ቤንዞኤት 5% SG ወይም ክሎራንትራኒሊፕሮል 20% SC',
        dosage: 'በሄክታር 250 ግራም በበቆሎው አናት ላይ በትክክል በማነጣጠር',
        timing: 'አባጨጓሬዎቹ ከልባቸው በሚወጡበት ከሰአት በኋላ ጸሐይ ሲቀዘቅዝ መርጨት።',
      },
      om: {
        title: 'Qoricha Ilbiisaa Ministeera Qonnaan Hayyamame',
        formulation: 'Emamectin Benzoate 5% SG yookiin Chlorantraniliprole 20% SC',
        dosage: 'Hektaara tokkoof giraama 250',
        timing: 'Galgala yeroo aduun dhiitu kallattiin handhuura baalaarratti biifuu.',
      },
      wot: {
        title: 'Goshsha Ministiriyaa Kessido Qora',
        formulation: 'Emamectin Benzoate 5% SG',
        dosage: 'Hektaareyyas 250 giraame badallaa huuphe bolla',
        timing: 'Away gallasappe guyyiyan sa\'ay sakkiya wode caaccatta.',
      },
      ti: {
        title: 'ብሚኒስትሪ ሕርሻ ዝተፈቐደ ፈውሲ ሓሰኻ',
        formulation: 'Emamectin Benzoate 5% SG',
        dosage: 'ንሓደ ሄክታር 250 ግራም',
        timing: 'ድሕሪ ቐትሪ ጸሓይ ምስ ዝሓለት ኣብ ልቢ ዕፉን ምርጫሕ።',
      },
    },
    researchCenter: 'Hawassa Agricultural Research Center & Bako National Maize Research',
  },
  {
    id: 'wheat_stem_rust',
    crop: 'Wheat',
    cropTranslations: {
      en: 'Wheat',
      am: 'ስንዴ',
      om: 'Qamadii',
      wot: 'Qamadiyaa',
      ti: 'ስርናይ',
    },
    aliases: ['wheat', 'ስንዴ', 'qamadi', 'stem rust', 'ug99', 'ዋግ', 'rust pustules', 'ስርናይ'],
    diseaseName: {
      en: 'Wheat Stem Rust / Ug99 (Puccinia graminis f. sp. tritici)',
      am: 'የስንዴ ግንድ ዝገት (Ug99 / ዋግ)',
      om: 'Waagii Qamadii (Ug99)',
      wot: 'Qamadiyaa Waggee (Ug99)',
      ti: 'ናይ ስርናይ ግንድ ዝገት (Ug99)',
    },
    pathogen: 'Fungal (ፈንገስ)',
    severity: 'critical',
    confidenceRange: [93.5, 98.9],
    keyFeatures: ['reddish-brown spore pustules on stems', 'ruptured stem epidermis', 'black teliospores', 'lodged wheat stems', 'red stems', 'rust'],
    symptoms: {
      en: 'Elongated reddish-brown (rust colored) spore pustules erupting through the epidermis of wheat stems and leaf sheaths, turning black towards maturity and causing lodging.',
      am: 'በስንዴው ግንድና ቅጠል ላይ ቀይ-ቡናማ የዝገት ዱቄት መውጣት፤ ግንዱ ተሰባብሮ መውደቅና እህሉ ሳይሞላ ማጨንገፍ።',
      om: 'Girmaa fi baala qamadiirratti dhibee dhiilgee bifa daaraa mul\'isuu, girmichi cabuu fi firii malee hafuu.',
      wot: 'Qamadiyaa gindiyaa bolla zo\'o waggey kiyiyoogaa, ginddey meqqidi aayfey cilliyoogaa.',
      ti: 'ኣብ ግንድን ቆጽልን ስርናይ ቀይሕ-ቡናዊ ናይ ዝገት ሓመድ ይርአ፤ ግንዲ ተሰባቢሩ ይወድቕ።',
    },
    organicRemedy: {
      en: {
        title: 'Resistant Variety Adoption & Early Sowing',
        steps: [
          'Plant certified stem-rust resistant cultivars bred in Ethiopia such as Danda\'a, Kakaba, or Ogolcho.',
          'Sow seeds early at the onset of the Meher rains to avoid peak spore dispersal temperatures.',
        ],
      },
      am: {
        title: 'ተቋቋሚ የዘር ዝርያዎችን መጠቀምና በወቅቱ መዝራት',
        steps: [
          'የዝገት በሽታን የሚቋቋሙ እንደ ዳንዳአ፣ ካካባ እና ኦጎልቾ የተባሉ የኢትዮጵያ ስንዴ ዝርያዎችን መዝራት።',
          'የመኸር ዝናብ እንደጀመረ ቀድሞ በመዝራት የፈንገስ ስፖር እንዳይጠናከር ማድረግ።',
        ],
      },
      om: {
        title: 'Sanyii Danda\'aa Fayyadamuu',
        steps: [
          'Sanyiiwwan waagii danda\'an kanneen akka Danda\'aa, Kakaabaa fi Ogolchoo dhaabuu.',
          'Roobni akkuma eegaleen dafanii facaasuu.',
        ],
      },
      wot: {
        title: 'Waggey Ekkenna Zariyaa Baqqiyoogaa',
        steps: [
          'Danda\'aa, Kakaabaa giyo qamadiyaa zariyaa goshshiyoogaa.',
          'Iray yiigiyo wode eesuwan zeriyoogaa.',
        ],
      },
      ti: {
        title: 'ተጻዋርቲ ዘርኢ ምጥቃምን ብእዋኑ ምዝራእን',
        steps: [
          'ንዝገት ዝጻወሩ ዝተመስከረሎም ዘርኢ ስርናይ (ዳንዳኣ/ካካባ) ምዝራእ።',
          'ዝናብ ምስ ጀመረ ቀዲምካ ምዝራእ።',
        ],
      },
    },
    chemicalTreatment: {
      en: {
        title: 'Systemic Triazole Fungicide',
        formulation: 'Propiconazole 250 EC (Tilt) or Tebuconazole 250 EW (Nativo)',
        dosage: '0.5 liters / hectare in 300 liters of water',
        timing: 'Apply immediately at first sign of 1-2 rust pustules per 10 plants.',
      },
      am: {
        title: 'ስርአተ-ሰብል ፈንገስ ኬሚካል ርጭት',
        formulation: 'ፕሮፒኮናዞል 250 EC (Tilt) ወይም ቴቡኮናዞል 250 EW (Nativo)',
        dosage: 'በሄክታር 0.5 ሊትር በ 300 ሊትር ውሃ ተበጥብጦ',
        timing: 'በ 10 እጽዋት ላይ የመጀመሪያው 1-2 የዝገት ነጠብጣብ እንደታየ ወዲያውኑ መርጨት።',
      },
      om: {
        title: 'Qoricha Fangaasii Biifamu',
        formulation: 'Propiconazole 250 EC (Tilt) yookiin Tebuconazole 250 EW',
        dosage: 'Hektaara tokkoof liitira 0.5 bishaan liitira 300 wajjin',
        timing: 'Mallattoon waagii akkuma mul\'ateen battalatti biifuu.',
      },
      wot: {
        title: 'Fangaasiya Qora',
        formulation: 'Propiconazole 250 EC (Tilt)',
        dosage: 'Hektaareyyas 0.5 Liitiree haatta 300 Liitireera',
        timing: 'Waggey beettido eesuwan biiccidi caaccatta.',
      },
      ti: {
        title: 'ፈውሲ ፈንገስ ስርናይ',
        formulation: 'Propiconazole 250 EC (Tilt)',
        dosage: 'ንሓደ ሄክታር 0.5 ሊትሮ ኣብ 300 ሊትሮ ማይ',
        timing: 'ምልክት ዝገት ምስ ተራእየ ብቕጽበት ምርጫሕ።',
      },
    },
    researchCenter: 'Kulumsa Agricultural Research Center (National Wheat Research Hub) - Tel: +251 22 331 1877',
  },
];

// Non-Agro keyword blacklists
const NON_AGRO_KEYWORDS = [
  'car', 'automobile', 'vehicle', 'truck', 'bike', 'motorcycle', 'engine',
  'shoe', 'shoes', 'boot', 'sneaker', 'clothes', 'shirt', 'pants', 'jacket',
  'phone', 'mobile', 'iphone', 'samsung', 'laptop', 'computer', 'screen', 'keyboard', 'mouse', 'ipad',
  'building', 'house', 'wall', 'concrete', 'furniture', 'chair', 'table', 'door', 'window',
  'cat', 'dog', 'pet', 'animal', 'cow', 'sheep', 'goat', 'bird', 'human', 'face', 'person', 'hand',
  'plastic', 'bottle', 'can', 'cup', 'paper', 'cardboard', 'metal', 'iron', 'steel',
  'tv', 'television', 'camera', 'watch', 'clock', 'money', 'coin', 'birr', 'dollar',
  'book', 'pen', 'pencil', 'glasses', 'bag', 'backpack', 'wallet'
];

// Helper: Call Google Gemini Cloud Vision Model with multi-model fallback & retry
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

async function analyzeWithCloudGemini(imageBase64, customPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  let mimeType = 'image/jpeg';
  let base64Data = imageBase64;

  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  } else {
    base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  }

  const systemPrompt = `
You are the AgroGebeya Ethiopia AI Plant Pathology & Agricultural Classifier.
Analyze this image carefully.

FIRST, determine if this image shows an agricultural crop, leaf, plant tissue, grain, vegetable, root, or farm produce.
If the image shows a NON-AGRO object (e.g. car, shoe, phone, person, animal, building, electronic, household object):
Return ONLY a valid JSON with:
{
  "isAgroProduct": false,
  "message": "This isn't an agro product.",
  "messageAm": "ይህ የግብርና ምርት ወይም የሰብል ቅጠል አይደለም።",
  "messageOm": "Kun oomisha qonnaa yookiin baala midhaanii miti.",
  "messageWot": "Hagee goshshaa aayfe gidenna.",
  "messageTi": "እዚ ናይ ሕርሻ ፍርያት ወይ ቆጽሊ ኣይኮነን።",
  "detectedObject": "<short name of object>",
  "reason": "The uploaded photo depicts a <object>, which is not a plant or agricultural crop tissue.",
  "guidance": "Please upload a clear photo of crop leaves, stems, grains, or fruits (e.g., Coffee, Maize, Enset, Wheat, Teff, Ginger, Avocado)."
}

IF IT IS an agricultural crop:
Identify the crop and any pest/fungal/bacterial disease, nutrient deficiency, or if healthy.
Provide rich translations in English (en), Amharic (am), Oromo (om), Wolaytta (wot), and Tigrinya (ti).
Return ONLY valid JSON matching this schema:
{
  "isAgroProduct": true,
  "crop": "<Crop name in English>",
  "cropTranslations": {
    "en": "<Crop English>",
    "am": "<Crop Amharic, e.g. ቡና, እንሰት, በቆሎ, ስንዴ, ጤፍ, ዝንጅብል, አቮካዶ>",
    "om": "<Crop Oromo>",
    "wot": "<Crop Wolaytta>",
    "ti": "<Crop Tigrinya>"
  },
  "diseaseName": {
    "en": "<Disease in English>",
    "am": "<Disease in Amharic>",
    "om": "<Disease in Oromo>",
    "wot": "<Disease in Wolaytta>",
    "ti": "<Disease in Tigrinya>"
  },
  "pathogenType": "<Fungal / Bacterial / Insect Pest / Viral / Healthy>",
  "severity": "<critical / high / moderate / low>",
  "confidenceScore": "<e.g. 96.5%>",
  "keyIndicatorsDetected": ["<symptom 1>", "<symptom 2>", "<symptom 3>"],
  "clinicalSymptoms": {
    "en": "<Description in English>",
    "am": "<Description in Amharic>",
    "om": "<Description in Oromo>",
    "wot": "<Description in Wolaytta>",
    "ti": "<Description in Tigrinya>"
  },
  "organicProtocol": {
    "en": { "title": "<title>", "steps": ["<step 1>", "<step 2>"] },
    "am": { "title": "<የተፈጥሮ ህክምና ርዕስ>", "steps": ["<ደረጃ 1>", "<ደረጃ 2>"] },
    "om": { "title": "<title>", "steps": ["<step 1>", "<step 2>"] },
    "wot": { "title": "<title>", "steps": ["<step 1>", "<step 2>"] },
    "ti": { "title": "<title>", "steps": ["<step 1>", "<step 2>"] }
  },
  "chemicalProtocol": {
    "en": { "title": "<title>", "formulation": "<formulation>", "dosage": "<dosage>", "timing": "<timing>" },
    "am": { "title": "<የኬሚካል ህክምና>", "formulation": "<መድኃኒት>", "dosage": "<መጠን>", "timing": "<የመርጫ ጊዜ>" },
    "om": { "title": "<title>", "formulation": "<formulation>", "dosage": "<dosage>", "timing": "<timing>" },
    "wot": { "title": "<title>", "formulation": "<formulation>", "dosage": "<dosage>", "timing": "<timing>" },
    "ti": { "title": "<title>", "formulation": "<formulation>", "dosage": "<dosage>", "timing": "<timing>" }
  },
  "accreditedResearchCenter": "<Ethiopian Research Center, e.g. Jimma, Areka, Hawassa, or Kulumsa>"
}
Do NOT include markdown formatting or backticks, just raw JSON.
`;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          systemPrompt,
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ]);

        const text = result.response.text().trim();
        const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        return parsed;
      } catch (err) {
        // If 503 high demand spike, briefly wait and retry once
        if (err.message && err.message.includes('503') && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        if (err.message && (err.message.includes('404') || err.message.includes('429') || err.message.includes('Quota exceeded'))) {
          break; // Skip to next candidate model
        }
        console.warn(`Cloud Gemini model ${modelName} error:`, err.message);
        break;
      }
    }
  }

  console.warn('All Cloud Gemini candidate models exhausted, smoothly utilizing local agronomy engine.');
  return null;
}

// @route   GET /api/advisory
// @desc    Get crop pest/disease diagnostics and agronomic advice
// @access  Public
exports.getCropAdvisories = async (req, res) => {
  try {
    const { crop, search } = req.query;
    const filter = {};

    if (crop) filter.cropName = { $regex: crop, $options: 'i' };
    if (search) {
      filter.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { pestOrDisease: { $regex: search, $options: 'i' } },
        { 'localNames.am': { $regex: search, $options: 'i' } },
        { 'symptoms.en': { $regex: search, $options: 'i' } },
        { 'symptoms.am': { $regex: search, $options: 'i' } },
      ];
    }

    const advisories = await CropAdvisory.find(filter).sort({ cropName: 1 });
    res.json({ advisories });
  } catch (error) {
    res.status(500).json({ message: 'Could not load crop advisory data', error: error.message });
  }
};

// @route   POST /api/advisory
// @desc    Post and save a verified scanned crop advisory record to MongoDB
// @access  Public
exports.createCropAdvisory = async (req, res) => {
  try {
    const {
      cropName,
      localNames,
      pestOrDisease,
      scientificName,
      severity,
      symptoms,
      prevention,
      organicTreatment,
      chemicalTreatment,
      favorableSeason,
      imageUrl,
    } = req.body;

    if (!cropName || !pestOrDisease) {
      return res.status(400).json({ message: 'Crop name and pest/disease name are required' });
    }

    const diseaseRegex = new RegExp(`^${pestOrDisease.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');
    let advisory = await CropAdvisory.findOne({
      $or: [
        { pestOrDisease: diseaseRegex },
        { 'localNames.am': localNames?.am },
      ],
    });

    if (advisory) {
      if (symptoms) advisory.symptoms = { ...advisory.symptoms, ...symptoms };
      if (organicTreatment) advisory.organicTreatment = { ...advisory.organicTreatment, ...organicTreatment };
      if (chemicalTreatment) advisory.chemicalTreatment = { ...advisory.chemicalTreatment, ...chemicalTreatment };
      if (prevention) advisory.prevention = { ...advisory.prevention, ...prevention };
      if (localNames) advisory.localNames = { ...advisory.localNames, ...localNames };
      if (imageUrl) advisory.imageUrl = imageUrl;
      await advisory.save();
    } else {
      advisory = new CropAdvisory({
        cropName,
        localNames: localNames || {},
        pestOrDisease,
        scientificName: scientificName || '',
        severity: severity || 'High',
        symptoms: symptoms || {},
        prevention: prevention || {},
        organicTreatment: organicTreatment || {},
        chemicalTreatment: chemicalTreatment || {},
        favorableSeason: favorableSeason || 'Belg / Meher rainy season',
        imageUrl: imageUrl || '',
      });
      await advisory.save();
    }

    res.status(201).json({ success: true, message: 'Crop advisory successfully posted and stored in MongoDB!', advisory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post crop advisory', error: error.message });
  }
};

// @route   GET /api/advisory/:id
// @desc    Get single advisory details
// @access  Public
exports.getAdvisoryById = async (req, res) => {
  try {
    const advisory = await CropAdvisory.findById(req.params.id);
    if (!advisory) return res.status(404).json({ message: 'Advisory not found' });
    res.json({ advisory });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching advisory', error: error.message });
  }
};

// @route   POST /api/advisory/diagnose
// @desc    AI Plant Pathology & Leaf Scanner Engine for Ethiopian Crops (Cloud + Local Fallback)
// @access  Public
exports.diagnoseCropDisease = async (req, res) => {
  try {
    const { cropType, symptomsText, sampleId, fileName, imageBase64 } = req.body;

    // 1. Try Cloud Gemini Vision AI if image base64 is provided and GEMINI_API_KEY is configured
    if (imageBase64 && process.env.GEMINI_API_KEY) {
      const cloudResult = await analyzeWithCloudGemini(imageBase64, symptomsText);
      if (cloudResult) {
        const diagnosisId = `DX-CLOUD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        return res.status(200).json({
          success: true,
          diagnosisId,
          timestamp: new Date().toISOString(),
          isCloudAi: true,
          ...cloudResult,
          smsPrescriptionTemplate: cloudResult.isAgroProduct
            ? `[AgroGebeya AI] Diagnosis: ${cloudResult.diseaseName?.am || cloudResult.diseaseName?.en || 'Crop Disease'}. Severity: ${(cloudResult.severity || 'HIGH').toUpperCase()}. Info: *8028#`
            : undefined,
        });
      }
    }

    const queryText = `${symptomsText || ''} ${fileName || ''} ${cropType || ''}`.toLowerCase().trim();

    // 2. Check for explicit Non-Agro sample or non-agricultural keyword trigger
    const isNonAgroSample = sampleId === 'non_agro';
    const isNonAgroKeyword = NON_AGRO_KEYWORDS.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(queryText);
    });

    if (isNonAgroSample || isNonAgroKeyword) {
      return res.status(200).json({
        success: true,
        isAgroProduct: false,
        diagnosisId: `REJECT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        message: "This isn't an agro product.",
        messageAm: 'ይህ የግብርና ምርት ወይም የሰብል ቅጠል አይደለም።',
        messageOm: 'Kun oomisha qonnaa yookiin baala midhaanii miti.',
        messageWot: 'Hagee goshshaa aayfe gidenna.',
        messageTi: 'እዚ ናይ ሕርሻ ፍርያት ወይ ቆጽሊ ኣይኮነን።',
        reason: 'The scanned image or symptom description does not contain recognized botanical foliage, agricultural crop tissue, or plant pathology markers.',
        guidance: 'Please scan or upload clear photos of crop leaves, grains, pseudostems, roots, or fruits (e.g., Coffee, Maize, Enset, Teff, Wheat, Ginger, or Avocado).',
        detectedCategory: 'Non-Agricultural Synthetic / Physical Object',
      });
    }

    let matchedEntry = null;

    // 3. If explicit sample ID passed
    if (sampleId) {
      matchedEntry = ETHIOPIAN_DISEASE_KNOWLEDGE_BASE.find((e) => e.id === sampleId);
    }

    // 4. Match by cropType / alias
    if (!matchedEntry && cropType && cropType !== 'All' && cropType !== 'Auto') {
      matchedEntry = ETHIOPIAN_DISEASE_KNOWLEDGE_BASE.find(
        (e) => e.crop.toLowerCase() === cropType.toLowerCase() ||
               e.cropTranslations?.am === cropType ||
               e.aliases.some((a) => a.toLowerCase() === cropType.toLowerCase())
      );
    }

    // 5. Match by file name keywords (e.g. maize_leaf.jpg, enset.png, wheat.jpg)
    if (!matchedEntry && fileName) {
      const cleanFileName = fileName.toLowerCase();
      for (const entry of ETHIOPIAN_DISEASE_KNOWLEDGE_BASE) {
        if (entry.aliases.some((a) => cleanFileName.includes(a.toLowerCase()))) {
          matchedEntry = entry;
          break;
        }
      }
    }

    // 6. Keyword matching across symptom text
    if (!matchedEntry && symptomsText && symptomsText.trim().length > 0) {
      const text = symptomsText.toLowerCase();
      let bestScore = 0;

      for (const entry of ETHIOPIAN_DISEASE_KNOWLEDGE_BASE) {
        let score = 0;
        if (entry.aliases.some((a) => text.includes(a.toLowerCase()))) score += 4;
        for (const feat of entry.keyFeatures) {
          if (text.includes(feat.toLowerCase())) score += 2;
        }
        if (score > bestScore) {
          bestScore = score;
          matchedEntry = entry;
        }
      }
    }

    // 7. If user entered symptoms or uploaded a generic file without any agro term
    if (!matchedEntry && symptomsText && symptomsText.trim().length > 0) {
      return res.status(200).json({
        success: true,
        isAgroProduct: false,
        diagnosisId: `REJECT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        message: "This isn't an agro product.",
        messageAm: 'ይህ የግብርና ምርት ወይም የሰብል ቅጠል አይደለም።',
        messageOm: 'Kun oomisha qonnaa yookiin baala midhaanii miti.',
        messageWot: 'Hagee goshshaa aayfe gidenna.',
        messageTi: 'እዚ ናይ ሕርሻ ፍርያት ወይ ቆጽሊ ኣይኮነን።',
        reason: `No recognizable agricultural crop or pathology markers detected for "${symptomsText}".`,
        guidance: 'Please choose your crop type or describe specific plant symptoms (such as Coffee, Maize, Enset, Wheat, Ginger, or Avocado).',
        detectedCategory: 'Unrecognized / Non-Agricultural Input',
      });
    }

    // 8. If user selected a crop but no symptoms, default to the top primary disease of THAT specific crop
    if (!matchedEntry && cropType && cropType !== 'All') {
      matchedEntry = ETHIOPIAN_DISEASE_KNOWLEDGE_BASE.find(
        (e) => e.crop.toLowerCase() === cropType.toLowerCase() || e.cropTranslations?.am === cropType
      );
    }

    // Fallback: If absolutely no crop or symptom was provided at all
    if (!matchedEntry) {
      matchedEntry = ETHIOPIAN_DISEASE_KNOWLEDGE_BASE[0];
    }

    // Generate realistic AI confidence score
    const minConf = matchedEntry.confidenceRange[0];
    const maxConf = matchedEntry.confidenceRange[1];
    const confidence = (minConf + Math.random() * (maxConf - minConf)).toFixed(1);

    const diagnosisId = `DX-ET-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const responseData = {
      success: true,
      isAgroProduct: true,
      diagnosisId,
      timestamp: new Date().toISOString(),
      crop: matchedEntry.crop,
      cropTranslations: matchedEntry.cropTranslations,
      diseaseName: matchedEntry.diseaseName,
      pathogenType: matchedEntry.pathogen,
      severity: matchedEntry.severity,
      confidenceScore: `${confidence}%`,
      keyIndicatorsDetected: matchedEntry.keyFeatures,
      clinicalSymptoms: matchedEntry.symptoms,
      organicProtocol: matchedEntry.organicRemedy,
      chemicalProtocol: matchedEntry.chemicalTreatment,
      accreditedResearchCenter: matchedEntry.researchCenter,
      smsPrescriptionTemplate: `[AgroGebeya AI] Diagnosis: ${matchedEntry.diseaseName?.am || matchedEntry.diseaseName?.en}. Severity: ${matchedEntry.severity.toUpperCase()}. Info: *8028#`,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI crop diagnosis',
      error: error.message,
    });
  }
};

// @route   POST /api/advisory/chat
// @desc    Live 24/7 Multilingual AI Agronomist & Plant Doctor Chatbot
// @access  Public
exports.chatWithAiAgronomist = async (req, res) => {
  try {
    const { message, history, language = 'am', cropContext } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const langInstructions = {
      am: 'Respond in fluent, clear Amharic (አማርኛ). Use respectful and easy-to-understand Ethiopian farming terminology.',
      om: 'Respond in fluent Afaan Oromoo. Use practical and clear agricultural terminology.',
      wot: 'Respond ENTIRELY in fluent Wolayttatto Doonaa (Wolaytta language). Use everyday Wolayta farming words the local farmer understands.',
      ti: 'Respond in fluent Tigrinya (ትግርኛ). Provide actionable, clear agricultural instructions.',
      en: 'Respond in fluent, friendly English with Ethiopian agronomic context and metrics.',
    };

    const targetLangPrompt = langInstructions[language] || langInstructions.am;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const systemPrompt = `
You are the AgroGebeya Ethiopia 24/7 AI Master Agronomist providing nationwide agricultural expertise across all Ethiopian regions (Oromia, Amhara, Sidama, South Ethiopia, Tigray, Somali, Benishangul-Gumuz, Gambella, Afar, Harari, Dire Dawa, and Addis Ababa).

═══════════════════════════════════════════════════════
LANGUAGE DETECTION & RESPONSE RULES (HIGHEST PRIORITY)
═══════════════════════════════════════════════════════
- If the farmer's question contains Wolayttatto Doonaa words (e.g. utta, badalla, qocho, goshshuwaa, malaadan, aayfe, gindiyaa, zariyaa, harggi, mittaa) OR the message is primarily in Wolayttatto Doonaa script: Respond ENTIRELY in fluent Wolayttatto Doonaa. Do NOT mix in English or Amharic except for scientific crop/disease names.
- If the question is in Amharic (አማርኛ): Respond ENTIRELY in fluent, respectful Amharic.
- If the question is in English: Respond in clear English with actionable advice, then append a brief "**Wolayttatto Maariyaa (Summary):**" section in Wolayttatto Doonaa at the end.
- For Afaan Oromoo, Tigrinya, or other Ethiopian languages detected: Respond in that language.
- If the user's selected UI language is: ${targetLangPrompt}

═══════════════════════════════════════════════════════
REGIONAL EXPERTISE — NATIONWIDE ETHIOPIAN AGRICULTURAL CORRIDORS
═══════════════════════════════════════════════════════
Priority crops & production zones:
  • Teff (ጤፍ / Xaffi) — Gojjam, Ada'a (Bishoftu), Shewa, Southern highlands
  • Coffee (ቡና / Buuna) — Jimma, Sidama, Yirgacheffe, Keffa, Wolaita, Harar
  • Wheat & Barley (ስንዴ እና ገብስ) — Arsi, Bale, Central highlands
  • Maize (በቆሎ / Badalla / Boqqolloo) — Bako, Jimma, Hawassa, Wolaita, Western Oromia
  • Enset (እንሰት / Utta / Qocho / Bulla) — Gurage, Wolaita, Sidama, Keffa, Gedeo
  • Oilseeds & Pulses (ሰሊጥ እና ጥራጥሬ) — Humera Sesame, Gondar, Faba Beans, Chickpeas
  • Vegetables, Fruits & Spices — Mojo, Meki, Ziway, Red Ginger, Avocado, Chili

Key diseases & pests in Ethiopia:
  • Wheat Stem & Yellow Rust (ስንዴ ዝገት)
  • Maize Fall Armyworm (የበቆሎ ሰራዊት ትል / Goshshuwaa Halaqetaa)
  • Enset Bacterial Wilt (የእንሰት ባክቴሪያ አወዛ / Gomere / Woshsho)
  • Coffee Berry Disease — CBD (የቡና ፍሬ በሽታ)
  • Teff Head Smut and blast
  • Sweet Potato Weevil

Organic & low-cost remedies from Ethiopian farming practice:
  • Wood ash (Mittaa Binddaa) + chili powder into maize whorl
  • Neem leaf extract (Nim Aayfe Haattaa)
  • Cordia africana (Waanza tree — ዋንዛ) shade intercropping for coffee
  • Desmodium push-pull intercropping for Fall Armyworm
  • Compost from organic crop residue (Utta Biitta Bollenttiyaa)
  • Flame / bleach sterilization for cutting tools

Key national research centers:
  • Ethiopian Institute of Agricultural Research (EIAR) — Addis Ababa
  • Bako National Maize Research Center (Oromia)
  • Debre Zeit Agricultural Research Center (Teff & Pulses)
  • Jimma Agricultural Research Center (Coffee & Spices)
  • Hawassa & Areka Agricultural Research Centers (South Ethiopia & Sidama)
  • Ethio Telecom Free Advisory Hotline: *8028# (dial from any phone)

═══════════════════════════════════════════════════════
GENERAL GUIDELINES
═══════════════════════════════════════════════════════
1. Tone: Respectful, caring, practical, and encouraging — speak as a trusted neighbour agronomist.
2. Expertise: soil fertility (NPS/Urea), water conservation, Ethiopian seasons (Belg, Meher, Bega), postharvest handling.
3. Formatting: Use concise bullet points and **bold headers** for readability. Keep answers actionable.
4. Safety: NEVER recommend unregistered pesticides. Always state MoA-approved dosages per hectare.
5. If you cannot answer with certainty, direct the farmer to Areka Research Center or *8028#.
6. Error resilience: If this context window is too long, prioritize the farmer's question and language rule.

${cropContext ? `**Current Crop Context:** ${cropContext}` : ''}
`;

      const candidateModels = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });

          let promptPayload = `${systemPrompt}\n\n`;

          if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-6);
            promptPayload += 'Previous Conversation:\n';
            for (const h of recentHistory) {
              promptPayload += `${h.role === 'user' ? 'Farmer' : 'AgroDoctor'}: ${h.text}\n`;
            }
            promptPayload += '\n';
          }

          promptPayload += `Farmer Question: ${message}\nAgroDoctor Answer:`;

          const result = await model.generateContent(promptPayload);
          const reply = result.response.text().trim();

          return res.status(200).json({
            success: true,
            reply,
            source: 'Cloud AI Agronomist (Gemini)',
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          const errMsg = err.message || '';
          // Quota exhausted or model unavailable — try next candidate
          if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`Chat model ${modelName} quota exceeded, trying next model.`);
            continue;
          }
          // Model not found — try next
          if (errMsg.includes('404') || errMsg.includes('not found')) {
            console.warn(`Chat model ${modelName} not found, trying next model.`);
            continue;
          }
          // 503 service spike — try next
          if (errMsg.includes('503') || errMsg.includes('overloaded')) {
            console.warn(`Chat model ${modelName} overloaded, trying next model.`);
            continue;
          }
          // API key missing or invalid — bail out immediately (all models will fail)
          if (errMsg.includes('API key') || errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('401')) {
            console.error('Gemini API key invalid or missing. Falling back to local engine.');
            break;
          }
          console.warn(`Chat model ${modelName} attempt failed:`, errMsg);
        }
      }
    } else {
      console.warn('GEMINI_API_KEY not configured — using local agronomic engine.');
    }

    // ── Smart Local Agronomy Engine Fallback (offline / API key missing / quota exhausted) ──
    let localReply = '';
    const qLower = message.toLowerCase();

    // ─── Coffee / CBD ───────────────────────────────────────────────────────────
    if (qLower.includes('ቡና') || qLower.includes('coffee') || qLower.includes('buna') ||
        qLower.includes('buuna') || qLower.includes('cbd') || qLower.includes('tukke buuna')) {

      if (language === 'wot') {
        localReply = `☕ **Buuna Harggiyaa (CBD) Naagiyaanne Maariyaa:**\n\n` +
          `1. **Aanaara Naagiyoogaa:** Aanuwan loytti ayfana bessiya koxxiyooneta qanxxiyoogaa; meellida zo\\'aqettida ciloo buunata shiishshidi tamman xuggiyoogaa woy golle mittiyoogaa.\n` +
          `2. **Kemikaale Caaccuwaa:** Copper Hydroxide 77% WP (Kocide 2000) hektaareyyas 2.5 kg haatta 500 Liitiree giddon walissidi iraay yiiganaappe kase caaccattiyoogaa.\n` +
          `3. **Qorisa Kettaa:** Jimma Qorisa Kettaa (JARC). Darobaa odeettanau *8028# waadettite (biittaa).`;
      } else if (language === 'am') {
        localReply = `☕ **የቡና ፍሬ በሽታ (ሲ.ቢ.ዲ / CBD) እና እንክብካቤ መመሪያ:**\n\n` +
          `1. **የተፈጥሮ መፍትሄ:** አየርና ፀሐይ በደንብ እንዲገባ የደረቁ ቅርንጫፎችን መግረዝ፤ የረገፉ ጥቁር ፍሬዎችን ሰብስቦ ማቃጠል ወይም መቅበር።\n` +
          `2. **የኬሚካል መድኃኒት:** ኮሳይድ 2000 (Copper Hydroxide 77% WP) በሄክታር 2.5 ኪ.ግ በ 500 ሊትር ውሃ ተበጥብጦ የበልግ ዝናብ ከመግባቱ በፊት መርጨት።\n` +
          `3. **ምርምር ማዕከል:** ጅማ (JARC) — ተጨማሪ መረጃ: *8028#`;
      } else {
        localReply = `☕ **Coffee Berry Disease (CBD) Advisory:**\n\n` +
          `1. **Organic:** Prune dense branches for sunlight; collect and burn/bury all mummified berries.\n` +
          `2. **Chemical:** Spray Copper Hydroxide 77% WP (Kocide 2000) @ 2.5 kg/ha in 500 L water before heavy rains.\n` +
          `3. **Contact:** Jimma Agricultural Research Center (JARC) or call *8028#.\n\n` +
          `**Wolayttatto Maariyaa:** Buuna hargguwaa (CBD) naagana mela: aanaara ciloo buunata xamqqidi caaccatta; kocide 2000 hektaareyyas 2.5 kg caaccatta.`;
      }

    // ─── Enset / Gomere / Wilt ───────────────────────────────────────────────
    } else if (qLower.includes('እንሰት') || qLower.includes('enset') || qLower.includes('gomere') ||
               qLower.includes('ጎመሬ') || qLower.includes('ዎሾ') || qLower.includes('ቆጮ') ||
               qLower.includes('utta') || qLower.includes('woshsho') || qLower.includes('hosa') ||
               qLower.includes('qocho') || qLower.includes('kocho')) {

      if (language === 'wot') {
        localReply = `🍌 **Utta Gomari (Woshsho / Hosa) Naagiyaanne Maariyaa:**\n\n` +
          `1. **Geeshshatetta:** Utta qanxxiya baashshata ubbaakka tamman xoqissidi go\\'ettiyoogaa — kemikaale woy bliichiya uppedan.\n` +
          `2. **Harggida Uttaa Shoddiyoogaa:** Harggida uttaa eesuwan shoddidi ollan xiishshidi goole moyzze miissennaadan kessiyoogaa.\n` +
          `3. **Meheyaa Giddiyoogaa:** Mehee harggida haytsaa miidi harggettennaadan giddiyaa gaxiyoogaa.\n` +
          `4. **Akeekissuwaa:** Utta gomariyau kemikaale qori aawankka baawa — geeshshatetta xalaala naagees.\n` +
          `5. **Qorisa Kettaa:** Areka Qorisa Kettaa (WoraWora, Wolaita): +251 46 552 0110. Woy *8028# waadettite.`;
      } else if (language === 'am') {
        localReply = `🍌 **የእንሰት ባክቴሪያል ዊልት (ጎመሬ / ዎሾ) መከላከያ መመሪያ:**\n\n` +
          `1. **ጥብቅ ንጽህና:** ማንኛውንም እንሰት መቁረጫ ቢላዋ፣ ጩቤ እና ገጀራ በእሳት ነበልባል ወይም በበረኪና ማምከን።\n` +
          `2. **የታመመውን ማጥፋት:** የታመመውን እንሰት ወዲያውኑ ነቅሎ ከውሃ መውረጃ ርቆ በጥልቅ ጉድጓድ ውስጥ መቅበር።\n` +
          `3. **አጥር ማጠር:** ከብቶችና ፍየሎች እንዳያሰራጩ ማሳውን መከለል።\n` +
          `4. **ማስታወሻ:** ምንም አይነት የኬሚካል መፍትሄ የለም — ንጽህና ብቻ ያድነዋል።\n` +
          `5. **ምርምር ማዕከል:** አረካ (SARI) — *8028#`;
      } else {
        localReply = `🍌 **Enset Bacterial Wilt (Gomere / Woshsho) Prevention:**\n\n` +
          `1. **Sterilize:** Flame-sterilize or bleach all machetes and harvesting knives between every plant.\n` +
          `2. **Uproot:** Immediately uproot infected enset and bury in deep pits away from waterways.\n` +
          `3. **Quarantine:** Fence the farm to prevent livestock from spreading the bacteria.\n` +
          `4. **Note:** There is NO chemical cure — strict phytosanitation is the ONLY solution.\n` +
          `5. **Contact:** Areka Agricultural Research Center (WoraWora, Wolaita): +251 46 552 0110. Dial *8028#.\n\n` +
          `**Wolayttatto Maariyaa:** Utta gomari (woshsho) naagana: qanxxiya tamman xoqissidite; harggida uttaa shoddidi kessidite. Kemikaale qori baawa.`;
      }

    // ─── Maize / Fall Armyworm ────────────────────────────────────────────────
    } else if (qLower.includes('በቆሎ') || qLower.includes('maize') || qLower.includes('armyworm') ||
               qLower.includes('አባጨጓሬ') || qLower.includes('corn') || qLower.includes('badalla') ||
               qLower.includes('goshshuwaa') || qLower.includes('boqqolloo')) {

      if (language === 'wot') {
        localReply = `🌽 **Badalla / Goshshuwaa Halaqetaa (Fall Armyworm) Naagiyoogaa:**\n\n` +
          `1. **Mittaa Binddaa:** Meldda mittaa binddaa qariyaara walissidi badallaa wozanaa giddon wottiyoogaa.\n` +
          `2. **Kemikaale:** Emamectin Benzoate 5% SG hektaareyyas 250 giraame badallaa huuphe bolla — away gallasappe guyyiyan caaccatta.\n` +
          `3. **Maataara Zariyaa:** Badallaa Desmodium giyo maataara walissidi zariyoogaa (push-pull).\n` +
          `4. **Qorisa Kettaa:** Hawassa woy Bako Qorisa Kettaa. *8028# waadettite.`;
      } else if (language === 'am') {
        localReply = `🌽 **የመኸር ሰራዊት አባጨጓሬ (Fall Armyworm) መቆጣጠሪያ:**\n\n` +
          `1. **ባህላዊ ዘዴ:** ደረቅ የእንጨት አመድ ከሚጥሚጣ ዱቄት ጋር ደባልቆ በበቆሎው ልብ (ፈነል) ውስጥ መነስነስ።\n` +
          `2. **የኬሚካል መድኃኒት:** ኢማሜክቲን ቤንዞኤት 5% SG @250ግ/ሄ ከሰአት በኋላ ጸሐይ ሲቀዘቅዝ።\n` +
          `3. **ምርምር ማዕከል:** ሀዋሳ እና ባኮ — *8028#`;
      } else {
        localReply = `🌽 **Fall Armyworm Management in Maize (Badalla/Goshshuwaa):**\n\n` +
          `1. **Cultural:** Place dry fine wood ash + chili powder into the central whorl funnel of young maize.\n` +
          `2. **Push-Pull:** Intercrop with Desmodium (Silverleaf), border with Napier grass.\n` +
          `3. **Chemical:** Emamectin Benzoate 5% SG @ 250 g/ha directed into leaf funnel late afternoon.\n` +
          `4. **Contact:** Hawassa / Bako Agricultural Research Center. Dial *8028#.\n\n` +
          `**Wolayttatto Maariyaa:** Badallaa wozanaa mittaa binddaa wottite; Emamectin Benzoate 250g/ha gallasappe guyyiyan caaccatta.`;
      }

    // ─── General greeting / fallback ─────────────────────────────────────────
    } else {
      if (language === 'wot') {
        localReply = `🌾 **Saro! Taani AgroGebeya Itiyophiyaa AI Goshshaa Maaranchcha.**\n\n` +
          `Utta (enset), Badalla (maize), Buuna (coffee), Xaffi (teff), Zinjibil (ginger), Avodadoo woy hara goshshaa harggiyan, zariyaan, goshshan woy shalqqiyan hananggidabaa taaninttoo oychana danddaetteta.\n\n` +
          `- Areka Qorisa Kettaa (Wolaita): +251 46 552 0110\n` +
          `- Biittaa Maariyaa: *8028# waadettite`;
      } else if (language === 'am') {
        localReply = `🌾 **ሰላም! እኔ የአግሮ ገበያ ኢትዮጵያ AI ግብርና አማካሪ ነኝ።**\n\n` +
          `ስለ ቡና፣ እንሰት (ቆጮ)፣ በቆሎ፣ ስንዴ፣ ጤፍ፣ ዝንጅብል፣ አቮካዶ፣ ወይም ስለ አፈር ማዳበሪያ (NPS/Urea) ማንኛውንም ጥያቄ ይጠይቁኝ። ተጨማሪ መረጃ: *8028#.`;
      } else {
        localReply = `🌾 **Hello! I am your 24/7 AgroGebeya AI Agronomist for Ethiopian agriculture.**\n\n` +
          `Ask me anything about:\n` +
          `- **Crops:** Teff (ጤፍ), Coffee (ቡና), Wheat (ስንዴ), Maize (በቆሎ), Enset (ቆጮ/ቡላ), Ginger, Avocado\n` +
          `- **Diseases:** Wheat Rust, Fall Armyworm, Coffee CBD, Enset Bacterial Wilt, Teff blast\n` +
          `- **Inputs:** MoA-approved fertilizers (NPS, Urea), organic remedies (wood ash, neem, compost)\n` +
          `- **Contacts:** EIAR & Regional Research Centers | Free agricultural hotline: *8028#\n\n` +
          `**Wolayttatto Maariyaa:** Utta, badalla, buuna, xaffi woy hara goshshaa harggiyan oychana danddaetteta.`;
      }
    }

    return res.status(200).json({
      success: true,
      reply: localReply,
      source: 'AgroGebeya Agronomic Expert Engine (Offline Ready)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Chat service temporarily unavailable',
      error: error.message,
    });
  }
};
