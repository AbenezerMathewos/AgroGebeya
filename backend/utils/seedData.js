require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const FreightTrip = require('../models/FreightTrip');
const CropAdvisory = require('../models/CropAdvisory');
const PoolOrder = require('../models/PoolOrder');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrogebeya_ethiopia';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
  } catch {
    await mongoose.connect('mongodb://127.0.0.1:27017/agrogebeya_ethiopia', { serverSelectionTimeoutMS: 4000 });
  }
  console.log('Connected to database for seeding...');

  // Clean old data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    MarketPrice.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    FreightTrip.deleteMany({}),
    CropAdvisory.deleteMany({}),
    PoolOrder.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const hashPass = (pw) => bcrypt.hash(pw, salt);

  // 1. Users
  const [adminPw, farmerPw, buyerPw] = await Promise.all([
    hashPass('Admin123456'),
    hashPass('Farmer123456'),
    hashPass('Buyer123456'),
  ]);

  const admin = await User.create({
    name: 'AgroGebeya Administrator',
    email: 'admin@agrogebeya.et',
    password: adminPw,
    role: 'admin',
    phone: '+251911000000',
    region: 'Addis Ababa',
    zone: 'Addis Ababa',
    preferredLanguage: 'am',
  });

  const farmerWolaita = await User.create({
    name: 'Alemu Wolde',
    email: 'alemu@agrogebeya.et',
    password: farmerPw,
    role: 'farmer',
    phone: '+251912345678',
    region: 'South Ethiopia',
    zone: 'Wolaita',
    woreda: 'Sodo Zuria',
    cooperativeName: 'Wolaita Smallholders Union',
    preferredLanguage: 'wot',
  });

  const farmerOromia = await User.create({
    name: 'Gemechu Abdisa',
    email: 'gemechu@agrogebeya.et',
    password: farmerPw,
    role: 'farmer',
    phone: '+251922334455',
    region: 'Oromia',
    zone: 'Jimma',
    woreda: 'Mana',
    cooperativeName: 'Keti Farmers Primary Cooperative',
    preferredLanguage: 'om',
  });

  const coopAmhara = await User.create({
    name: 'Tadesse Mengesha (Coop Manager)',
    email: 'tadesse@agrogebeya.et',
    password: farmerPw,
    role: 'cooperative',
    phone: '+251933445566',
    region: 'Amhara',
    zone: 'West Gojjam',
    woreda: 'Bahir Dar Zuria',
    cooperativeName: 'Gojjam Union Grain Pool',
    preferredLanguage: 'am',
  });

  const transporterGirma = await User.create({
    name: 'Girma Desta (Transporter)',
    email: 'girma@agrogebeya.et',
    password: farmerPw,
    role: 'transporter',
    phone: '+251944556677',
    region: 'South Ethiopia',
    zone: 'Wolaita',
    preferredLanguage: 'am',
  });

  const buyerMarta = await User.create({
    name: 'Marta Bekele (Wholesale Grain Merchant)',
    email: 'marta@agrogebeya.et',
    password: buyerPw,
    role: 'buyer',
    phone: '+251911223344',
    region: 'Addis Ababa',
    zone: 'Addis Ababa',
    preferredLanguage: 'am',
  });

  const buyerDawit = await User.create({
    name: 'Dawit Kebede (Food Processing Enterprise)',
    email: 'dawit@agrogebeya.et',
    password: buyerPw,
    role: 'buyer',
    phone: '+251955667788',
    region: 'Oromia',
    zone: 'East Shewa',
    woreda: 'Adama',
    preferredLanguage: 'om',
  });

  console.log('Seeded Users: Admin, Farmers, Cooperatives, Transporters, Buyers.');

  // 2. Products across Ethiopia
  const products = await Product.create([
    {
      title: 'Premium Magna White Teff (የማኛ ነጭ ጤፍ)',
      category: 'Grain',
      price: 11200,
      quantity: 120,
      unit: 'Quintal',
      minOrderQuantity: 5,
      grade: 'Grade 1 (Export/Premium)',
      region: 'Amhara',
      zone: 'East Gojjam',
      woreda: 'Debre Markos',
      location: 'Debre Markos Warehouse, East Gojjam',
      description: 'High-purity white Magna Teff harvested from fertile red soil. Machine-cleaned, zero sand, moisture content under 11%. Perfect for commercial injera and wholesale grain supply.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: true,
      cooperativeName: 'Gojjam Union Grain Pool',
      owner: coopAmhara._id,
      isAvailable: true,
    },
    {
      title: 'Jimma Specialty Washed Arabica Coffee (የጅማ ቡና)',
      category: 'Coffee',
      price: 24500,
      quantity: 45,
      unit: 'Quintal',
      minOrderQuantity: 2,
      grade: 'Grade 1 (Export/Premium)',
      region: 'Oromia',
      zone: 'Jimma',
      woreda: 'Mana',
      location: 'Mana Woreda Washing Station, Jimma',
      description: 'Grade-1 specialty arabica coffee beans, altitude 1,950m. Floral jasmine aroma with citrus notes and winey body. Sun-dried on raised African beds. Fully traceable batch.',
      images: ['https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: false,
      cooperativeName: 'Keti Farmers Primary Cooperative',
      owner: farmerOromia._id,
      isAvailable: true,
    },
    {
      title: 'Wolaita Sodo Fresh Red Teff (የወላይታ ቀይ ጤፍ)',
      category: 'Grain',
      price: 8800,
      quantity: 60,
      unit: 'Quintal',
      minOrderQuantity: 1,
      grade: 'Grade 2 (Standard Market)',
      region: 'South Ethiopia',
      zone: 'Wolaita',
      woreda: 'Sodo Zuria',
      location: 'Sodo Central Aggregation Point',
      description: 'Iron-rich organic red teff grown traditionally without synthetic chemicals. Excellent flavor, dense nutritional value. Ready for bulk pickup or freight dispatch.',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: false,
      owner: farmerWolaita._id,
      isAvailable: true,
    },
    {
      title: 'Fresh Organic Ginger / Zinjibil (ትኩስ ዝንጅብል)',
      category: 'Spices',
      price: 180,
      quantity: 450,
      unit: 'Kg',
      minOrderQuantity: 20,
      grade: 'Grade 1 (Export/Premium)',
      region: 'South Ethiopia',
      zone: 'Wolaita',
      woreda: 'Boloso Sore',
      location: 'Areka Market Hub',
      description: 'Freshly harvested aromatic Wolaita ginger with high essential oil content. Washed and sorted. Ideal for essential oil extraction, spices, or wholesale city markets.',
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: false,
      owner: farmerWolaita._id,
      isAvailable: true,
    },
    {
      title: 'Hass Avocados - Export Quality (ሃስ አቮካዶ)',
      category: 'Fruit',
      price: 135,
      quantity: 1500,
      unit: 'Kg',
      minOrderQuantity: 50,
      grade: 'Grade 1 (Export/Premium)',
      region: 'Oromia',
      zone: 'Jimma',
      woreda: 'Limmu',
      location: 'Limmu Avocado Orchards',
      description: 'Rich, creamy Hass avocados cultivated under regenerative agroforestry systems. Uniform sizing, defect-free, harvested at optimal dry matter percentage for transport.',
      images: ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: true,
      cooperativeName: 'Keti Farmers Primary Cooperative',
      owner: farmerOromia._id,
      isAvailable: true,
    },
    {
      title: 'High-Yield White Maize (ነጭ በቆሎ)',
      category: 'Grain',
      price: 4900,
      quantity: 250,
      unit: 'Quintal',
      minOrderQuantity: 10,
      grade: 'Grade 2 (Standard Market)',
      region: 'South Ethiopia',
      zone: 'Wolaita',
      woreda: 'Damot Gale',
      location: 'Boditi Cooperative Depot',
      description: 'Cleaned yellow-white hybrid maize. Dry moisture level (12%), stored in hermetic PICS bags to eliminate weevil damage. Ready for flour mills or animal feed compounders.',
      images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=60'],
      isCooperativePooled: true,
      cooperativeName: 'Wolaita Smallholders Union',
      owner: farmerWolaita._id,
      isAvailable: true,
    },
  ]);

  console.log(`Seeded ${products.length} Products across Ethiopia.`);

  // 3. National Market Prices for Arbitrage Radar
  await MarketPrice.create([
    {
      crop: 'White Teff (ነጭ ጤፍ)',
      market: 'Addis Ababa (Ehil Berenda)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 12500,
      highPrice: 13800,
      averagePrice: 13150,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'White Teff (ነጭ ጤፍ)',
      market: 'Debre Markos (East Gojjam)',
      region: 'Amhara',
      marketType: 'Primary Farmgate',
      lowPrice: 10800,
      highPrice: 11400,
      averagePrice: 11100,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'White Teff (ነጭ ጤፍ)',
      market: 'Adama (Central Hub)',
      region: 'Oromia',
      marketType: 'Regional Hub',
      lowPrice: 11900,
      highPrice: 12600,
      averagePrice: 12250,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Red Teff (ቀይ ጤፍ)',
      market: 'Addis Ababa (Ehil Berenda)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 9800,
      highPrice: 10700,
      averagePrice: 10250,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'Red Teff (ቀይ ጤፍ)',
      market: 'Wolaita Sodo Market',
      region: 'South Ethiopia',
      marketType: 'Primary Farmgate',
      lowPrice: 8400,
      highPrice: 9000,
      averagePrice: 8700,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'White Maize (ነጭ በቆሎ)',
      market: 'Addis Ababa (Merkato)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 6200,
      highPrice: 6900,
      averagePrice: 6550,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'White Maize (ነጭ በቆሎ)',
      market: 'Boditi Market (Wolaita)',
      region: 'South Ethiopia',
      marketType: 'Primary Farmgate',
      lowPrice: 4600,
      highPrice: 5100,
      averagePrice: 4850,
      unit: 'Quintal',
      trend: 'falling',
    },
    {
      crop: 'White Maize (ነጭ በቆሎ)',
      market: 'Shashemene Market',
      region: 'Oromia',
      marketType: 'Regional Hub',
      lowPrice: 5300,
      highPrice: 5800,
      averagePrice: 5550,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'Specialty Coffee (የታጠበ ቡና)',
      market: 'Addis Ababa (ECX Terminal)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 28000,
      highPrice: 32000,
      averagePrice: 30000,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Specialty Coffee (የታጠበ ቡና)',
      market: 'Jimma Central Market',
      region: 'Oromia',
      marketType: 'Primary Farmgate',
      lowPrice: 23500,
      highPrice: 25500,
      averagePrice: 24500,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Fresh Ginger (ትኩስ ዝንጅብል)',
      market: 'Addis Ababa (Atikilt Tera)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 260,
      highPrice: 310,
      averagePrice: 285,
      unit: 'Kg',
      trend: 'rising',
    },
    {
      crop: 'Fresh Ginger (ትኩስ ዝንጅብል)',
      market: 'Areka Market (Wolaita)',
      region: 'South Ethiopia',
      marketType: 'Primary Farmgate',
      lowPrice: 170,
      highPrice: 195,
      averagePrice: 182,
      unit: 'Kg',
      trend: 'stable',
    },
    {
      crop: 'Yirgacheffe Coffee Q1 (ይርጋጨፌ ቡና)',
      market: 'Addis Ababa (ECX Terminal)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 34000,
      highPrice: 38500,
      averagePrice: 36250,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Yirgacheffe Coffee Q1 (ይርጋጨፌ ቡና)',
      market: 'Dilla Sourcing Depot (Sidama)',
      region: 'Sidama',
      marketType: 'Primary Farmgate',
      lowPrice: 28000,
      highPrice: 31000,
      averagePrice: 29500,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Hass Avocado (ሃስ አቮካዶ)',
      market: 'Addis Ababa (Bole Fruit Terminal)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 120,
      highPrice: 160,
      averagePrice: 140,
      unit: 'Kg',
      trend: 'rising',
    },
    {
      crop: 'Hass Avocado (ሃስ አቮካዶ)',
      market: 'Sodo Farmers Market (Wolaita)',
      region: 'South Ethiopia',
      marketType: 'Primary Farmgate',
      lowPrice: 65,
      highPrice: 85,
      averagePrice: 75,
      unit: 'Kg',
      trend: 'stable',
    },
    {
      crop: 'Durum Wheat (የዳቦ ስንዴ)',
      market: 'Addis Ababa (Ehil Berenda)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 7800,
      highPrice: 8600,
      averagePrice: 8200,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Durum Wheat (የዳቦ ስንዴ)',
      market: 'Robe Grain Union (Bale)',
      region: 'Oromia',
      marketType: 'Primary Farmgate',
      lowPrice: 6200,
      highPrice: 6800,
      averagePrice: 6500,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'Red Kidney Beans (ቀይ ቦሎቄ)',
      market: 'Addis Ababa (Merkato)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 8200,
      highPrice: 9100,
      averagePrice: 8650,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Red Kidney Beans (ቀይ ቦሎቄ)',
      market: 'Hawassa Regional Depot',
      region: 'Sidama',
      marketType: 'Regional Hub',
      lowPrice: 6800,
      highPrice: 7400,
      averagePrice: 7100,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'Humera White Sesame (ሁመራ ሰሊጥ)',
      market: 'Addis Ababa (ECX Export Floor)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 16500,
      highPrice: 18200,
      averagePrice: 17350,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Humera White Sesame (ሁመራ ሰሊጥ)',
      market: 'Gondar Aggregation Warehouse',
      region: 'Amhara',
      marketType: 'Regional Hub',
      lowPrice: 13800,
      highPrice: 14900,
      averagePrice: 14350,
      unit: 'Quintal',
      trend: 'rising',
    },
    {
      crop: 'Fermented Kocho / Enset (ቆጮ)',
      market: 'Addis Ababa (Shola Market)',
      region: 'Addis Ababa',
      marketType: 'Central Terminal (Wholesale)',
      lowPrice: 3800,
      highPrice: 4600,
      averagePrice: 4200,
      unit: 'Quintal',
      trend: 'stable',
    },
    {
      crop: 'Fermented Kocho / Enset (ቆጮ)',
      market: 'Bedessa Market (Wolaita)',
      region: 'South Ethiopia',
      marketType: 'Primary Farmgate',
      lowPrice: 2400,
      highPrice: 2900,
      averagePrice: 2650,
      unit: 'Quintal',
      trend: 'stable',
    },
  ]);


  console.log('Seeded National Market Prices & Arbitrage Dataset.');

  // 4. Logistics Freight Trips (Empty return matching)
  await FreightTrip.create([
    {
      transporter: transporterGirma._id,
      driverName: 'Girma Desta',
      driverPhone: '+251944556677',
      vehicleType: 'Isuzu NPR (35-50 Quintals)',
      plateNumber: 'ET-3-45891',
      originRegion: 'South Ethiopia',
      originCity: 'Wolaita Sodo',
      destinationRegion: 'Addis Ababa',
      destinationCity: 'Addis Ababa (Ehil Berenda)',
      departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      totalCapacityQuintals: 45,
      availableCapacityQuintals: 30,
      pricePerQuintal: 380,
      isReturnTripDiscount: true,
      notes: 'Returning from Sodo to Addis with 30 quintals empty capacity. Can pick up from Boditi, Alaba, or Shashemene along the main highway.',
      status: 'scheduled',
    },
    {
      transporter: transporterGirma._id,
      driverName: 'Tariku Bekele',
      driverPhone: '+251911998877',
      vehicleType: 'FSR Truck (70-100 Quintals)',
      plateNumber: 'ET-3-88219',
      originRegion: 'Oromia',
      originCity: 'Jimma',
      destinationRegion: 'Addis Ababa',
      destinationCity: 'Addis Ababa (Merkato)',
      departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalCapacityQuintals: 85,
      availableCapacityQuintals: 55,
      pricePerQuintal: 420,
      isReturnTripDiscount: true,
      notes: 'FSR truck returning to capital. Clean bed suitable for coffee sacks, avocados, or spices. En-route pickup at Welkite & Woliso.',
      status: 'scheduled',
    },
  ]);

  console.log('Seeded Freight Trips.');

  // 5. Crop Disease & Agronomic Advisory Catalog
  await CropAdvisory.create([
    {
      cropName: 'Enset (False Banana)',
      localNames: {
        am: 'የእንሰት ባክቴሪያል ዊልት (ጎመሬ)',
        om: 'Bacterial Wilt Qoccoo',
        wot: 'Wosaa Dangisa (Gomere)',
        ti: 'ናይ እንሰት ባክቴርያዊ ሕማም',
      },
      pestOrDisease: 'Bacterial Wilt of Enset (Xanthomonas vasicola pv. musacearum)',
      severity: 'Critical',
      symptoms: {
        en: 'Yellowing and wilting of inner leaves, slimy yellowish bacterial ooze when the pseudostem is cut, collapse of the central spindle, rotting of the corm (bulla/kocho).',
        am: 'የመሀል ቅጠሎች ወደ ቢጫነት መቀየርና መድረቅ፣ ግንዱ ሲቆረጥ የሚወጣ ቢጫ ዝልግልግ ፈሳሽ፣ የዋናው ቡቃያ መውደቅ እና የቆጮ/ቡላ ክምችት መበስበስ።',
        om: 'Baalli keessoo keelloo ta’uu fi goguu, yeroo muki muramu dhangala’aa keelloo ba’uu, jirma bu’uuraa tortoruu.',
        wot: 'Giddo hayttati qanxxidi melaassi, mittan qanxxiyo wode biixa zilliga kiyessi, bullayi wolqqada wuraassi.',
      },
      prevention: {
        en: 'Sterilize farm machetes/knives using flame or bleach before moving between plants; fence fields to keep infected livestock out; quarantine new suckers.',
        am: 'ቢላዋዎችንና ቆንጆዎችን በእሳት ወይም በበረኪና ማፅዳት፤ ከበሽታው ነፃ የሆኑ ችግኞችን ብቻ መትከል፤ እንስሳት በበሽታው የተያዘውን ቅጠል እንዳይበሉ መከልከል።',
        om: 'Meeshaalee qonnaa ibiddaan ykn alkooliin qulqulleessuu; biqiltuu dhukkubarraa bilisa ta’e qofa dhaabuu.',
        wot: 'Qancayta bariyawani tamani gishiyo; hara saani eheyada haranta yedoogee aawa diggiyo.',
      },
      organicTreatment: {
        en: 'Strict phytosanitation: Completely uproot infected plants, dig a deep burial pit, apply wood ash, and leave the infected spot unplanted for 6 months.',
        am: 'የተያዘውን ተክል ከነሥሩ ነቅሎ ማቃጠል ወይም በጥልቅ ጉድጓድ መቅበር፣ አመድ መበተን እና ቦታውን ለ 6 ወራት አለማረስ።',
        om: 'Biqiltuu qabame buqqisanii gubuu ykn boolla gadi fagoo keessatti awwaaluu, daaraa firfarsuu.',
        wot: 'Boorenna wosiya biroka kessidi taman eyido; bindiyanne bidiya hesa goxanta yashiyo.',
      },
      chemicalTreatment: {
        en: 'No chemical cure exists for bacterial wilt once inside vascular tissue. Prevention and strict tool disinfection with 5% sodium hypochlorite (bleach) is mandatory.',
        am: 'አንዴ የገባውን ባክቴሪያ በኬሚካል ማዳን አይቻልም። በረኪና (Sodium hypochlorite) ለመሳሪያዎች ማፅጃ መጠቀም ግዴታ ነው።',
        om: 'Qorichi keemikaalaa kan fayyisu hin jiru; meeshaalee qulqulleessuun qofti fala.',
        wot: 'Kemikaleni pathiyo baawa; qancita barakiinan qanccidi gishiyo.',
      },
    },
    {
      cropName: 'Coffee (ቡና)',
      localNames: {
        am: 'የቡና ፍሬ በሽታ (ሲ.ቢ.ዲ / CBD)',
        om: 'Dhukkuba Firi Bunaa (CBD)',
        wot: 'Tukkiya Aypiya Harge',
        ti: 'ሕማም ፍረ ቡን',
      },
      pestOrDisease: 'Coffee Berry Disease (Colletotrichum kahawae)',
      severity: 'High',
      symptoms: {
        en: 'Dark sunken spots on green coffee berries, premature berry dropping, mummified black dry berries remaining on the branch, severe yield loss during wet seasons.',
        am: 'በጥሬው አረንጓዴ ቡና ፍሬ ላይ ጥቁር የሰመጡ ነጠብጣቦች መታየት፣ ፍሬው ሳይደርስ መርገፍ እና ቅርንጫፉ ላይ የደረቀ ጥቁር ፍሬ መቅረት።',
        om: 'Firi bunaa magariisa irratti mallattoo gurraacha mul’achuu, firiin bilchaatuun dura harca’uu.',
        wot: 'Woga buuniyan karetti tokkoti beytiyo; ayppiyan wogishenna wocidi kundiyo.',
      },
      prevention: {
        en: 'Prune excess shade to improve air circulation; plant CBD-resistant varieties bred by Jimma Agricultural Research Center (JARC); timely fungicide application before heavy rains.',
        am: 'የዛፎችን ጥላ በመቀነስ አየርና ፀሐይ እንዲገባ ማድረግ፤ የጅማ ግብርና ምርምር ያወጣቸውን ተቋቋሚ ዝርያዎችን መትከል፤ ከከባድ ዝናብ በፊት መከላከል መርጨት።',
        om: 'Gaaddisa hir’isuun qilleensa galchuu; sanyii qoricha dandamatu kan JARC dhaabuu.',
        wot: 'Koyishi aawayanne carke yeliyada mitsa qanxiyo; JARC kessido loe buuniya aypiyo.',
      },
      organicTreatment: {
        en: 'Neem-based botanical sprays, copper hydroxide approved formulations, and clearing fallen mummified berries from the tree base.',
        am: 'የኒም ቅጠል ውህድ መርጨት፤ በኦርጋኒክ የተፈቀደ የኮፐር ውህድ መጠቀም እና የወደቁ ደረቅ ፍሬዎችን ሰብስቦ ማቃጠል።',
        om: 'Biqiltuu Niimii fayyadamuu fi firiwwan lafa irratti harca’an walitti qabanii gubuu.',
        wot: 'Nimmiya hayttawa hayisi eheyadi shociyo; kundido buuniya taman eyido.',
      },
      chemicalTreatment: {
        en: 'Copper oxychloride 50% WP or systemic triazole fungicides applied at early flowering and berry expansion stage according to MoA guidelines.',
        am: 'ኮፐር ኦክሲክሎራይድ (Copper oxychloride) ወይም የተፈቀዱ ፈንገስ ኬሚካሎችን በወቅቱ በግብርና ባለሙያ መመሪያ መሰረት መርጨት።',
        om: 'Keemikaala Copper Oxychloride fi kan kana fakkaatan qajeelfama ogeessa qonnaatiin fayyadamuu.',
        wot: 'Koppere oksiklorayide kemikaliyan eranchati wotido mogiyan shociyo.',
      },
    },
    {
      cropName: 'Teff (ጤፍ)',
      localNames: {
        am: 'የጤፍ ዋግ / ዝገት (Rust)',
        om: 'Wagii Xaafii',
        wot: 'Gashshaa Waagiya',
        ti: 'ዋግ ጣፍ',
      },
      pestOrDisease: 'Teff Rust (Uromyces eragrostidis)',
      severity: 'Moderate',
      symptoms: {
        en: 'Reddish-brown powdery pustules on leaves and stems, stunted grain filling, premature yellowing of teff grass.',
        am: 'በጤፉ ቅጠልና አገዳ ላይ ቡናማ ቀላ ያለ ዱቄት መሰል ነጠብጣቦች፣ ፍሬ አለመያዝና የጤፉ ቅጠል ቶሎ መድረቅ።',
        om: 'Baala xaafii irratti daakuu magaala diimaa fakkaatu mul’achuu, xaafiin bilchina ga’aa dhabuu.',
        wot: 'Hayttani bolla zozzo biixati kiyada gashshayi loeyada aypenana ixxiyo.',
      },
      prevention: {
        en: 'Row planting with optimal seed rate (10-15 kg/ha instead of broadcasting 30-40 kg/ha); crop rotation with pulses (chickpeas/faba bean).',
        am: 'በመስመር መዝራት (የዘር መጠንን 10-15 ኪ.ግ በሄክታር መቀነስ)፤ ከአተርና ሽምብራ ጋር ተራርቆ ማረስ።',
        om: 'Toxxoon dhaabuu fi sanyii wal jijjiiranii facaasuu (Ateraa fi Shumburaa wajjin).',
        wot: 'Zaratan wotidi zeriyo; shomburaranne ateran zeroyada soxiyo.',
      },
      organicTreatment: {
        en: 'Wood ash dusting in early morning when dew is present; fermented compost tea sprays to enhance leaf microbiome.',
        am: 'ጠዋት በጤዛ ወቅት አመድ በጤፉ ላይ መበተን፤ የተመጣጠነ የተፈጥሮ ማዳበሪያ ውህድ መጠቀም።',
        om: 'Ganama daaraa firfarsuu fi kompoostii fayyadamuu.',
        wot: 'Maado guurata amediya shociyo; kassi loe kompostiya yosho.',
      },
      chemicalTreatment: {
        en: 'Propiconazole or Tebuconazole foliar application if infection crosses economic threshold during tillering/heading.',
        am: 'በከፍተኛ ደረጃ ሲጠቃ በባለሙያ በሚታዘዝ የፈንገስ ኬሚካል (Tilt / Rex Duo) መርጨት።',
        om: 'Qoricha fangasii ogeessi ajajeen biifuu.',
        wot: 'Eranchati erishe kemikaliyan loeyada shociyo.',
      },
    },
    {
      cropName: 'Maize (በቆሎ)',
      localNames: {
        am: 'የመኸር ሰራዊት አባጨጓሬ (Fall Armyworm)',
        om: 'Raammoo Boqqolloo (Fall Armyworm)',
        wot: 'Badala Yilliyeta (Armyworm)',
        ti: 'ሓሰኻ መሸላ / በቆሎ',
      },
      pestOrDisease: 'Fall Armyworm (Spodoptera frugiperda)',
      severity: 'Critical',
      symptoms: {
        en: 'Window pane leaf damage on whorl, deep ragged feeding holes in leaves, sawdust-like larval frass in leaf funnels, eaten cobs.',
        am: 'በበቆሎው እምብርት ውስጥ ቅጠል መቦርቦር፣ መሰል ቆሻሻ/ፍርስራሽ በእምብርቱ ውስጥ መታየት እና የበቆሎውን ራስ መብላት።',
        om: 'Baala boqqolloo keessa seenuun cicciruu, boolla baala irratti uumuu.',
        wot: 'Badala giddo kessan hayttan biroyada burshiyo; aypiya meena aypiyo.',
      },
      prevention: {
        en: 'Early planting at the start of rains; intercropping maize with Desmodium (Push-Pull technology); regular field scouting.',
        am: 'ዝናብ እንደጀመረ ቀድሞ መዝራት፤ በቆሎን ከዴስሞዲየም (Desmodium) ጋር አዳቅሎ መዝራት (Push-Pull ዘዴ)።',
        om: 'Yeroon facaasuu fi mala "Push-Pull" jedhamu fayyadamuu.',
        wot: 'Ira wode koyishi zeriyo; hara mitsatanne zeridi teqiyo.',
      },
      organicTreatment: {
        en: 'Placing fine wood ash or dry sand mixed with ground hot pepper in the central funnel of the plant to kill young caterpillars.',
        am: 'በበቆሎው እምብርት ውስጥ አሸዋ ወይም አመድ ከሚጥሚጣ ዱቄት ጋር ቀላቅሎ መጨመር፤ የእጅ አሰሳ በማድረግ ትሎችን መቅጨት።',
        om: 'Daaraa ykn cirracha qulqulluu miitoo wajjin makanii bu’uura boqqolloo keessa buusuu.',
        wot: 'Badala giddon shashawan amediya karridani eyiyo; kushiyan denttidi woxiyo.',
      },
      chemicalTreatment: {
        en: 'Coragen (Chlorantraniliprole) or Ampligo applied directly into the whorls in late afternoon according to MoA registered formulations.',
        am: 'በግብርና ባለሙያ የታዘዙ ፀረ-ተባይ ኬሚካሎችን (Ampligo / Coragen) አመሻሽ ላይ ወደ በቆሎው እምብርት ብቻ ማነጣጠር።',
        om: 'Keemikaala kan akka Ampligo ogeessa qonnaatiin galgala biifuu.',
        wot: 'Ampligo kemikaliya omarsa wode giddo badalan shociyo.',
      },
    },
  ]);

  console.log('Seeded Crop Health & Advisory Catalog.');

  // 6. Sample Orders with Telebirr Escrow and Reviews
  const order1 = await Order.create({
    product: products[0]._id, // White Teff
    buyer: buyerMarta._id,
    farmer: coopAmhara._id,
    quantity: 20,
    unit: 'Quintal',
    unitPrice: 11200,
    totalPrice: 224000,
    fulfillment: 'freight_pool',
    deliveryAddress: {
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      specificAddress: 'Ehil Berenda Wholesale Gate 4',
    },
    contactPhone: '+251911223344',
    paymentMethod: 'telebirr',
    paymentStatus: 'released_to_farmer',
    escrowTransactionId: 'ET-ESCROW-89217402',
    note: 'Delivered in excellent condition. High quality clean white teff.',
    status: 'completed',
  });

  await Review.create({
    product: products[0]._id,
    order: order1._id,
    buyer: buyerMarta._id,
    farmer: coopAmhara._id,
    rating: 5,
    comment: 'Exceptional Grade-1 White Teff. Zero sand, dry, delivered via Isuzu freight on time. Telebirr escrow release was smooth!',
  });

  const order2 = await Order.create({
    product: products[1]._id, // Jimma Coffee
    buyer: buyerDawit._id,
    farmer: farmerOromia._id,
    quantity: 10,
    unit: 'Quintal',
    unitPrice: 24500,
    totalPrice: 245000,
    fulfillment: 'delivery',
    deliveryAddress: {
      region: 'Oromia',
      city: 'Adama',
      specificAddress: 'Industrial Zone Lot 12',
    },
    contactPhone: '+251955667788',
    paymentMethod: 'cbe_birr',
    paymentStatus: 'escrow_held',
    escrowTransactionId: 'ET-ESCROW-91028341',
    note: 'In transit from Jimma washing station to Adama processing facility.',
    status: 'in_transit',
  });

  // Seed Virtual Yield Pooling Contracts (Multi-farmer bulk procurement)
  await PoolOrder.create([
    {
      cropName: 'White Hybrid Maize (Bako)',
      variety: 'BH-540 Hybrid',
      buyer: buyerMarta._id,
      targetQuantity: 50,
      currentQuantity: 35,
      unit: 'Quintal',
      unitPrice: 3200,
      totalContractValue: 160000,
      totalCommission: 8000,
      platformCommissionRate: 0.05,
      deliveryRegion: 'South Ethiopia (Soddo University Cafeteria)',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'open',
      description: 'Bulk procurement contract for Soddo University student dining services. Multi-smallholder pooling accepted.',
      contributors: [
        {
          farmer: farmerWolaita._id,
          quantity: 15,
          qualityGrade: 'Grade A',
          payoutDue: 45600, // 15 * 3200 * 0.95
          joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          farmer: farmerOromia._id,
          quantity: 20,
          qualityGrade: 'Grade A',
          payoutDue: 60800, // 20 * 3200 * 0.95
          joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      cropName: 'Fermented Enset / Bulla',
      variety: 'Mazia Premium',
      buyer: buyerDawit._id,
      targetQuantity: 40,
      currentQuantity: 10,
      unit: 'Quintal',
      unitPrice: 4800,
      totalContractValue: 192000,
      totalCommission: 9600,
      platformCommissionRate: 0.05,
      deliveryRegion: 'Addis Ababa (Merkato Terminal Depot)',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'open',
      description: 'Industrial food processing requirement for export-grade Bulla powder.',
      contributors: [
        {
          farmer: farmerWolaita._id,
          quantity: 10,
          qualityGrade: 'Grade A',
          payoutDue: 45600, // 10 * 4800 * 0.95
          joinedAt: new Date(),
        },
      ],
    },
  ]);

  console.log('Seeded Virtual Yield Pooling Contracts & Smallholder Pledges.');
  console.log('Seeded Demo Orders & Reviews with Escrow.');
  console.log('\n--- SEED COMPLETE ---');
  console.log('Admin Account:   admin@agrogebeya.et / Admin123456');
  console.log('Farmer Account:  alemu@agrogebeya.et / Farmer123456');
  console.log('Coop Account:    tadesse@agrogebeya.et / Farmer123456');
  console.log('Buyer Account:   marta@agrogebeya.et / Buyer123456');
  console.log('Transporter:     girma@agrogebeya.et / Farmer123456');
  console.log('---------------------\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});
