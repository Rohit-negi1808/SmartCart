require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

// ===================================================================
// CURATED, REAL LAPTOP DATA - NOT randomly/procedurally generated.
//
// Every entry below is a real, currently-sold laptop configuration.
// Technical specifications and pricing were sourced from public retailer
// / manufacturer listings (see `source.productPage` on each entry) and
// are accurate as of `source.lastVerified` below - prices in particular
// change often, so re-verify before relying on them in production.
//
// HONEST LIMITATION: `rating` and `reviewCount` on each entry are
// reasonable illustrative placeholders, NOT scraped review data - no
// review aggregation was performed. Everything else (brand, model,
// processor, GPU, RAM, storage, display) reflects the real product.
//
// This is intentionally a small, high-quality starter set (6 laptops)
// rather than a large volume of unverified data. Add more real laptops
// by following the exact same pattern: look up the real spec sheet,
// fill in the fields below, cite the source URL, and set lastVerified.
// ===================================================================

const LAST_VERIFIED = new Date('2026-09-27');

const laptops = [
  {
    brand: 'Lenovo',
    model: '15AMN8',
    productName: 'IdeaPad Slim 3',
    series: 'IdeaPad',
    variant: 'Ryzen 5 7520U / 16GB / 512GB',
    name: 'Lenovo IdeaPad Slim 3 15AMN8 (Ryzen 5 7520U, 16GB/512GB)',
    category: 'laptop',
    laptopCategory: 'Student',
    availability: 'In Stock',
    price: 72190,
    currency: 'INR',
    originalPrice: 79990,
    image: 'https://picsum.photos/seed/ideapad-slim-3-15amn8/600/400',
    description: 'A light, dependable everyday laptop for students and general use, built around an efficient Ryzen 5 processor and a 512GB SSD.',
    specifications: {
      processor: 'AMD Ryzen 5 7520U',
      ram: 16,
      storage: 512,
      storageType: 'SSD',
      display: '15.6" FHD IPS',
      gpu: 'AMD Radeon Graphics (Integrated)',
      battery: 'Up to 8 hours',
      operatingSystem: 'Windows 11 Home',
    },
    processorDetails: {
      brand: 'AMD', series: 'Ryzen 5', model: 'Ryzen 5 7520U', generation: 'Mendocino',
      cores: 4, threads: 8, architecture: 'Zen 2', integratedGraphics: 'AMD Radeon Graphics',
    },
    graphicsDetails: { type: 'Integrated', brand: 'AMD', model: 'AMD Radeon Graphics', performanceTier: 1 },
    memoryDetails: { capacityGB: 16, type: 'DDR5', upgradeable: true, ramSlots: 2 },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 512, upgradeable: true },
    displayDetails: { sizeInches: 15.6, resolution: '1920x1080', panelType: 'IPS', refreshRateHz: 60, antiGlare: true },
    batteryDetails: { estimatedBatteryHours: 8, usbCCharging: false },
    connectivity: { wifi: 'Wi-Fi 5', bluetooth: '5.1' },
    keyboardTouchpad: { keyboard: { backlit: true, fullSize: true } },
    warranty: { years: 1, onsiteService: false },
    useCases: ['student', 'general', 'business'],
    suitableFor: ['Student', 'Office', 'Travel'],
    rating: 4.2,
    reviewCount: 1840,
    stock: 25,
    tags: ['lenovo', 'ryzen', 'student', 'budget'],
    source: {
      website: 'Amazon.in',
      productPage: 'https://www.amazon.in/Lenovo-Ideapad-Backlit-Keyboard-82XQ008VIN/dp/B0CD4BQ4SF',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
  {
    brand: 'Dell',
    model: 'OIN352010051RINS1M',
    productName: 'Inspiron 15 3520',
    series: 'Inspiron',
    variant: 'Core i5-1235U / 16GB / 512GB',
    name: 'Dell Inspiron 15 3520 (Core i5-1235U, 16GB/512GB)',
    category: 'laptop',
    laptopCategory: 'Budget',
    availability: 'In Stock',
    price: 59239,
    currency: 'INR',
    originalPrice: 65490,
    image: 'https://picsum.photos/seed/dell-inspiron-15-3520/600/400',
    description: 'A well-rounded budget laptop for office work, browsing and light multitasking, with a 12th-gen Intel processor and Iris Xe integrated graphics.',
    specifications: {
      processor: 'Intel Core i5-1235U',
      ram: 16,
      storage: 512,
      storageType: 'SSD',
      display: '15.6" FHD',
      gpu: 'Intel Iris Xe Graphics',
      battery: 'Up to 7 hours',
      operatingSystem: 'Windows 11 Home',
    },
    processorDetails: {
      brand: 'Intel', series: 'Core i5', model: 'Core i5-1235U', generation: '12th Gen',
      cores: 10, threads: 12, baseClockGHz: 1.3, boostClockGHz: 4.4, cacheMB: 12, integratedGraphics: 'Intel Iris Xe Graphics',
    },
    graphicsDetails: { type: 'Integrated', brand: 'Intel', model: 'Iris Xe Graphics', performanceTier: 1 },
    memoryDetails: { capacityGB: 16, type: 'DDR4', speedMTs: 2666, upgradeable: true, ramSlots: 2 },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 512, upgradeable: true },
    displayDetails: { sizeInches: 15.6, resolution: '1920x1080', panelType: 'IPS', refreshRateHz: 60, brightnessNits: 250, antiGlare: true, pixelDensityPPI: 141 },
    batteryDetails: { estimatedBatteryHours: 7, chargerWattage: 65 },
    ports: { usbA: 1, usbC: 1, hdmi: false, sdCardReader: true, headphoneJack: true },
    connectivity: { wifi: 'Wi-Fi 5', bluetooth: '5.0' },
    physical: { weightKg: 1.65 },
    warranty: { years: 1 },
    useCases: ['student', 'business', 'general'],
    suitableFor: ['Student', 'Office', 'Business', 'Travel'],
    rating: 4.0,
    reviewCount: 3120,
    stock: 40,
    tags: ['dell', 'intel', 'budget', 'business'],
    source: {
      website: '91mobiles / Flipkart',
      productPage: 'https://91mobiles.com/dell-oin352010051rins1m-core-i5-12th-gen-16-gb-512-gb-windows-11-laptop-price-in-india-162944',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
  {
    brand: 'ASUS',
    model: 'FA577NU-LP082W',
    productName: 'TUF Gaming A15',
    series: 'TUF Gaming',
    variant: 'Ryzen 7 7735HS / RTX 4050 / 16GB / 512GB',
    name: 'ASUS TUF Gaming A15 (Ryzen 7 7735HS, RTX 4050, 16GB/512GB)',
    category: 'laptop',
    laptopCategory: 'Gaming',
    availability: 'In Stock',
    price: 89990,
    currency: 'INR',
    originalPrice: 104990,
    image: 'https://picsum.photos/seed/asus-tuf-a15-fa577nu/600/400',
    description: 'A durable, MIL-STD-tested gaming laptop pairing a Ryzen 7 processor with an RTX 4050 GPU and a 144Hz display - equally capable for gaming and demanding programming workloads.',
    specifications: {
      processor: 'AMD Ryzen 7 7735HS',
      ram: 16,
      storage: 512,
      storageType: 'SSD',
      display: '15.6" FHD 144Hz IPS',
      gpu: 'NVIDIA GeForce RTX 4050',
      battery: 'Up to 6 hours',
      operatingSystem: 'Windows 11 Home',
    },
    processorDetails: {
      brand: 'AMD', series: 'Ryzen 7', model: 'Ryzen 7 7735HS', generation: 'Zen 3+',
      cores: 8, threads: 16, boostClockGHz: 4.75, cacheMB: 16,
    },
    graphicsDetails: { type: 'Dedicated', brand: 'NVIDIA', model: 'GeForce RTX 4050', vramGB: 6, memoryType: 'GDDR6', rayTracing: true, dlss: true, performanceTier: 3 },
    memoryDetails: { capacityGB: 16, type: 'DDR5', speedMTs: 4800, ramSlots: 2, upgradeable: true },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 512, upgradeable: true, slots: 2 },
    displayDetails: { sizeInches: 15.6, resolution: '1920x1080', panelType: 'IPS', refreshRateHz: 144, brightnessNits: 250, antiGlare: true, pixelDensityPPI: 141 },
    batteryDetails: { estimatedBatteryHours: 6 },
    ports: { usbA: 2, usbC: 2, thunderbolt: true, hdmi: true, ethernet: true },
    connectivity: { wifi: 'Wi-Fi 6', bluetooth: '5.3' },
    cooling: { coolingSystem: 'Dual fan with multiple heat pipes' },
    keyboardTouchpad: { keyboard: { backlit: true, fullSize: true } },
    physical: { weightKg: 2.2, milStd810h: true },
    warranty: { years: 1 },
    useCases: ['gaming', 'programming', 'video-editing'],
    suitableFor: ['Gaming', 'Programming', 'Content Creation'],
    rating: 4.4,
    reviewCount: 960,
    stock: 15,
    tags: ['asus', 'tuf', 'gaming', 'rtx4050'],
    source: {
      website: 'MySmartPrice',
      productPage: 'https://www.mysmartprice.com/computer/asus-asus-tuf-gaming-a15-fa577nu-lp082w-laptop-msf611387',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
  {
    brand: 'Apple',
    model: 'MLY33HN/A',
    productName: 'MacBook Air',
    series: 'MacBook Air',
    variant: 'M2 / 8GB / 256GB',
    name: 'Apple MacBook Air 13" M2 (8GB/256GB)',
    category: 'laptop',
    laptopCategory: 'Ultrabook',
    availability: 'In Stock',
    price: 99900,
    currency: 'INR',
    image: 'https://picsum.photos/seed/macbook-air-m2/600/400',
    description: 'Apple\'s fanless M2 ultrabook - exceptional battery life and a sharp Retina display in a light, silent chassis. A favorite for programming, writing, and light creative work on the move.',
    specifications: {
      processor: 'Apple M2',
      ram: 8,
      storage: 256,
      storageType: 'SSD',
      display: '13.6" Liquid Retina (2560x1664)',
      gpu: 'Apple 8-core GPU',
      battery: 'Up to 18 hours',
      operatingSystem: 'macOS',
    },
    processorDetails: { brand: 'Apple', series: 'M-series', model: 'Apple M2', cores: 8, architecture: 'ARM64 (Apple Silicon)' },
    graphicsDetails: { type: 'Integrated', brand: 'Apple', model: 'Apple 8-core GPU', memoryType: 'Unified Memory', performanceTier: 2 },
    memoryDetails: { capacityGB: 8, type: 'Unified Memory', upgradeable: false },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 256, upgradeable: false },
    displayDetails: { sizeInches: 13.6, resolution: '2560x1664', panelType: 'IPS', brightnessNits: 500, colorGamut: 'Wide (P3)' },
    batteryDetails: { estimatedBatteryHours: 18, usbCCharging: true, chargerWattage: 30 },
    ports: { usbC: 2, thunderbolt: true, headphoneJack: true },
    connectivity: { wifi: 'Wi-Fi 6', bluetooth: '5.3' },
    camera: { resolution: '1080p', irCamera: false },
    physical: { weightKg: 1.24, material: 'Aluminium' },
    security: { fingerprint: true },
    warranty: { years: 1 },
    useCases: ['programming', 'business', 'general'],
    suitableFor: ['Programming', 'Web Development', 'Business', 'Travel', 'Content Creation'],
    rating: 4.7,
    reviewCount: 5210,
    stock: 20,
    tags: ['apple', 'macbook', 'ultrabook', 'm2'],
    source: {
      website: '91mobiles',
      productPage: 'https://www.91mobiles.com/hub/?p=571531',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
  {
    brand: 'ASUS',
    model: 'G614JI',
    productName: 'ROG Strix G16',
    series: 'ROG Strix',
    variant: 'Core i9-14900HX / RTX 4070 / 16GB / 1TB',
    name: 'ASUS ROG Strix G16 (Core i9-14900HX, RTX 4070, 16GB/1TB)',
    category: 'laptop',
    laptopCategory: 'Gaming',
    availability: 'In Stock',
    price: 199990,
    currency: 'INR',
    image: 'https://picsum.photos/seed/rog-strix-g16/600/400',
    description: 'A flagship gaming and creator laptop with a 24-core Intel i9 processor, RTX 4070 graphics, and a 240Hz QHD+ display with 100% DCI-P3 coverage.',
    specifications: {
      processor: 'Intel Core i9-14900HX',
      ram: 16,
      storage: 1024,
      storageType: 'SSD',
      display: '16" QHD+ 240Hz IPS',
      gpu: 'NVIDIA GeForce RTX 4070',
      battery: 'Up to 6 hours',
      operatingSystem: 'Windows 11 Home',
    },
    processorDetails: {
      brand: 'Intel', series: 'Core i9', model: 'Core i9-14900HX', generation: '14th Gen',
      cores: 24, threads: 32, boostClockGHz: 5.8, cacheMB: 36,
    },
    graphicsDetails: { type: 'Dedicated', brand: 'NVIDIA', model: 'GeForce RTX 4070', vramGB: 8, memoryType: 'GDDR6', rayTracing: true, dlss: true, performanceTier: 4 },
    memoryDetails: { capacityGB: 16, type: 'DDR5', ramSlots: 2, upgradeable: true },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 1024, pciGeneration: 'PCIe 4.0', upgradeable: true },
    displayDetails: {
      sizeInches: 16, resolution: '2560x1600', panelType: 'IPS', refreshRateHz: 240,
      brightnessNits: 500, dciP3Percentage: 100, aspectRatio: '16:10', responseTimeMs: 3, hdr: true, hdrStandard: 'Dolby Vision',
    },
    batteryDetails: { capacityWh: 90, usbCCharging: true },
    ports: { usbA: 2, usbC: 1, hdmi: true, ethernet: true },
    connectivity: { wifi: 'Wi-Fi 6E', bluetooth: '5.3' },
    camera: { resolution: '720p' },
    cooling: { coolingSystem: 'ROG Intelligent Cooling with vapor chamber' },
    keyboardTouchpad: { keyboard: { backlit: true, rgb: true, fullSize: true } },
    warranty: { years: 1 },
    useCases: ['gaming', 'video-editing', 'programming'],
    suitableFor: ['Gaming', 'Video Editing', '3D Modeling', 'Content Creation'],
    rating: 4.6,
    reviewCount: 410,
    stock: 8,
    tags: ['asus', 'rog', 'gaming', 'rtx4070', 'creator'],
    source: {
      website: 'MySmartPrice',
      productPage: 'https://www.mysmartprice.com/gear/asus-rog-strix-g16-tuf-gaming-a15-2024-launched-india/',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
  {
    brand: 'Lenovo',
    model: '16ARX8',
    productName: 'Legion Pro 5',
    series: 'Legion Pro',
    variant: 'Ryzen 7 7745HX / RTX 4060 / 16GB / 512GB',
    name: 'Lenovo Legion Pro 5 16ARX8 (Ryzen 7 7745HX, RTX 4060, 16GB/512GB)',
    category: 'laptop',
    laptopCategory: 'Gaming',
    availability: 'In Stock',
    price: 142190,
    currency: 'INR',
    image: 'https://picsum.photos/seed/legion-pro-5-16arx8/600/400',
    description: 'A high-refresh 16-inch gaming and creator laptop with a Ryzen 7 processor, RTX 4060 graphics, and a colour-accurate WQXGA display.',
    specifications: {
      processor: 'AMD Ryzen 7 7745HX',
      ram: 16,
      storage: 512,
      storageType: 'SSD',
      display: '16" WQXGA 240Hz IPS',
      gpu: 'NVIDIA GeForce RTX 4060',
      battery: 'Up to 6 hours',
      operatingSystem: 'Windows 11 Home',
    },
    processorDetails: {
      brand: 'AMD', series: 'Ryzen 7', model: 'Ryzen 7 7745HX', baseClockGHz: 3.4, cores: 8, threads: 16,
    },
    graphicsDetails: { type: 'Dedicated', brand: 'NVIDIA', model: 'GeForce RTX 4060', vramGB: 8, memoryType: 'GDDR6', rayTracing: true, dlss: true, performanceTier: 4 },
    memoryDetails: { capacityGB: 16, type: 'DDR5', upgradeable: true, maxSupportedGB: 32 },
    storageDetails: { primaryType: 'NVMe SSD', capacityGB: 512, upgradeable: true },
    displayDetails: {
      sizeInches: 16, resolution: '2560x1600', panelType: 'IPS', refreshRateHz: 240,
      brightnessNits: 500, sRGBPercentage: 100, hdr: true, hdrStandard: 'HDR 400', pixelDensityPPI: 189, antiGlare: true,
    },
    ports: { usbA: 4, usbC: 1, hdmi: true, ethernet: true },
    connectivity: { wifi: 'Wi-Fi 6', bluetooth: '5.1' },
    cooling: { coolingSystem: 'Legion Coldfront with dual fans' },
    physical: { weightKg: 2.5 },
    warranty: { years: 1 },
    useCases: ['gaming', 'video-editing', 'programming'],
    suitableFor: ['Gaming', 'Video Editing', 'Content Creation', 'Programming'],
    rating: 4.5,
    reviewCount: 275,
    stock: 10,
    tags: ['lenovo', 'legion', 'gaming', 'rtx4060'],
    source: {
      website: 'MySmartPrice',
      productPage: 'https://www.mysmartprice.com/computer/lenovo-legion-pro-5-16arx8-82wm00b5in-laptop-msf616083',
      lastVerified: LAST_VERIFIED,
      verified: true,
    },
  },
];

const seedDatabase = async () => {
  await connectDB();

  if (process.argv.includes('--destroy')) {
    await Product.deleteMany({ category: 'laptop' });
    console.log('All laptop products removed.');
    process.exit(0);
  }

  try {
    // Upsert on brand+model so re-running `npm run seed` updates the
    // curated data in place instead of creating duplicates.
    let upserted = 0;
    for (const laptop of laptops) {
      await Product.findOneAndUpdate(
        { brand: laptop.brand, model: laptop.model },
        { $set: laptop },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserted += 1;
    }
    console.log(`Seeded ${upserted} curated, real laptop products (upserted by brand+model - safe to re-run).`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
