const mongoose = require('mongoose');

// --- Existing simple spec schema, UNCHANGED ---
// Kept exactly as-is so the current frontend (ProductCard, ProductDetails,
// FilterPanel, Compare, recommendationEngine.js, geminiService.js) keeps
// working without modification. New, far more detailed specs live in the
// separate nested objects below and are additive, not replacements.
const specificationsSchema = new mongoose.Schema(
  {
    processor: { type: String, required: true },
    ram: { type: Number, required: true }, // in GB
    storage: { type: Number, required: true }, // in GB
    storageType: {
      type: String,
      enum: ['SSD', 'HDD', 'SSD+HDD'],
      default: 'SSD',
    },
    display: { type: String, required: true },
    gpu: { type: String, default: 'Integrated Graphics' },
    battery: { type: String, required: true }, // e.g. "Up to 10 hours"
    operatingSystem: { type: String, default: 'Windows 11' },
  },
  { _id: false }
);

// ===================================================================
// Detailed, comprehensive spec categories (all optional - not every
// manufacturer publishes every field). These power the deeper product
// details page and finer-grained filtering/scoring without touching
// the simple `specifications` object the rest of the app already reads.
// ===================================================================

const processorDetailsSchema = new mongoose.Schema(
  {
    brand: String, // Intel, AMD, Apple, Qualcomm
    series: String, // Core, Ryzen, M-series, Snapdragon X
    model: String, // e.g. "Core i7-13700H"
    generation: String,
    cores: Number,
    threads: Number,
    baseClockGHz: Number,
    boostClockGHz: Number,
    cacheMB: Number,
    tdpW: Number,
    architecture: String,
    integratedGraphics: String,
    npuAvailable: Boolean,
    npuTOPS: Number,
  },
  { _id: false }
);

const graphicsDetailsSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Integrated', 'Dedicated', 'Integrated + Dedicated'] },
    brand: String, // NVIDIA, AMD, Intel, Apple
    model: String, // e.g. "GeForce RTX 4060"
    vramGB: Number,
    memoryType: String, // GDDR6, LPDDR5 shared, etc.
    tgpW: Number,
    rayTracing: Boolean,
    dlss: Boolean,
    fsr: Boolean,
    // 1 (basic integrated) - 5 (flagship dedicated GPU). Stored explicitly
    // and set deterministically at seed time so the recommendation engine
    // never has to guess GPU strength from a free-text model name.
    performanceTier: { type: Number, min: 1, max: 5, default: 1 },
  },
  { _id: false }
);

const memoryDetailsSchema = new mongoose.Schema(
  {
    capacityGB: Number,
    type: { type: String, enum: ['DDR4', 'DDR5', 'LPDDR4', 'LPDDR4X', 'LPDDR5', 'LPDDR5X', 'Unified Memory', 'Other'] },
    speedMTs: Number,
    channels: Number,
    upgradeable: Boolean,
    ramSlots: Number,
    maxSupportedGB: Number,
  },
  { _id: false }
);

const storageDetailsSchema = new mongoose.Schema(
  {
    primaryType: { type: String, enum: ['NVMe SSD', 'SATA SSD', 'HDD', 'eMMC', 'UFS'] },
    capacityGB: Number,
    interface: String,
    pciGeneration: String,
    formFactor: String,
    upgradeable: Boolean,
    slots: Number,
    additionalStorageSupport: String,
  },
  { _id: false }
);

const displayDetailsSchema = new mongoose.Schema(
  {
    sizeInches: Number,
    resolution: String, // e.g. "1920x1080"
    widthPixels: Number,
    heightPixels: Number,
    panelType: { type: String, enum: ['IPS', 'OLED', 'Mini LED', 'TN', 'VA', 'Other'] },
    refreshRateHz: Number,
    brightnessNits: Number,
    colorGamut: String,
    sRGBPercentage: Number,
    dciP3Percentage: Number,
    adobeRGBPercentage: Number,
    colorAccuracyDeltaE: Number,
    aspectRatio: String,
    responseTimeMs: Number,
    touchscreen: Boolean,
    hdr: Boolean,
    hdrStandard: String,
    antiGlare: Boolean,
    glossy: Boolean,
    adaptiveSync: Boolean,
    pixelDensityPPI: Number, // PPI, not DPI
  },
  { _id: false }
);

const batteryDetailsSchema = new mongoose.Schema(
  {
    capacityWh: Number,
    batteryType: String,
    estimatedBatteryHours: Number,
    fastCharging: Boolean,
    usbCCharging: Boolean,
    chargerWattage: Number,
  },
  { _id: false }
);

const portsSchema = new mongoose.Schema(
  {
    usbA: Number,
    usbC: Number,
    usbCVersion: String,
    thunderbolt: Boolean,
    usb4: Boolean,
    hdmi: Boolean,
    hdmiVersion: String,
    displayPort: Boolean,
    ethernet: Boolean,
    ethernetSpeed: String,
    sdCardReader: Boolean,
    microSDReader: Boolean,
    headphoneJack: Boolean,
    dcChargingPort: Boolean,
    kensingtonLock: Boolean,
  },
  { _id: false }
);

const connectivitySchema = new mongoose.Schema(
  {
    wifi: { type: String, enum: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7'] },
    bluetooth: String,
    cellularAvailable: Boolean,
    cellularNetwork: String,
  },
  { _id: false }
);

const cameraSchema = new mongoose.Schema(
  {
    resolution: String,
    megapixels: Number,
    irCamera: Boolean,
    privacyShutter: Boolean,
    aiFeatures: Boolean,
  },
  { _id: false }
);

const audioSchema = new mongoose.Schema(
  {
    speakers: String,
    speakerType: String,
    dolbyAtmos: Boolean,
    dts: Boolean,
    microphoneCount: Number,
    noiseCancellation: Boolean,
  },
  { _id: false }
);

const keyboardTouchpadSchema = new mongoose.Schema(
  {
    keyboard: {
      backlit: Boolean,
      rgb: Boolean,
      numpad: Boolean,
      fullSize: Boolean,
      spillResistant: Boolean,
      fingerprintReader: Boolean,
      windowsHello: Boolean,
    },
    touchpad: {
      precision: Boolean,
      haptic: Boolean,
      size: String,
    },
  },
  { _id: false }
);

const physicalSchema = new mongoose.Schema(
  {
    material: String,
    color: String,
    weightKg: Number,
    thicknessMm: Number,
    widthMm: Number,
    depthMm: Number,
    hingeType: String,
    milStd810h: Boolean,
  },
  { _id: false }
);

const coolingSchema = new mongoose.Schema(
  {
    fans: Number,
    heatPipes: Number,
    vaporChamber: Boolean,
    coolingSystem: String,
    fanNoiseDb: Number,
  },
  { _id: false }
);

const securitySchema = new mongoose.Schema(
  {
    tpm: Boolean,
    tpmVersion: String,
    fingerprint: Boolean,
    irWindowsHello: Boolean,
    secureBoot: Boolean,
    webcamPrivacyShutter: Boolean,
    biosPassword: Boolean,
    encryptionSupport: String,
  },
  { _id: false }
);

const upgradeabilitySchema = new mongoose.Schema(
  {
    ram: Boolean,
    storage: Boolean,
    wifiCard: Boolean,
    battery: Boolean,
    maximumRamGB: Number,
    maximumStorageGB: Number,
  },
  { _id: false }
);

const softwareFeaturesSchema = new mongoose.Schema(
  {
    virtualization: Boolean,
    linuxSupport: Boolean,
    wslSupport: Boolean,
    dockerSupport: Boolean,
    multipleMonitorSupport: Boolean,
  },
  { _id: false }
);

const accessoriesSchema = new mongoose.Schema(
  {
    charger: Boolean,
    carryingBag: Boolean,
    mouse: Boolean,
    stylus: Boolean,
    adapter: Boolean,
    manuals: Boolean,
  },
  { _id: false }
);

const warrantySchema = new mongoose.Schema(
  {
    years: Number,
    onsiteService: Boolean,
    accidentalDamageProtection: Boolean,
    extendedWarrantyAvailable: Boolean,
    batteryWarrantyYears: Number,
  },
  { _id: false }
);

// Distinguishes curated/verified data from anything generated for testing.
const sourceSchema = new mongoose.Schema(
  {
    website: String,
    productPage: String,
    lastVerified: Date,
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // --- A. Basic product information ---
    name: { type: String, required: true, trim: true }, // kept for backward compat (existing UI title)
    model: String,
    productName: String,
    series: String,
    variant: String,
    productUrl: String,
    brand: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        'laptop', 'accessory', 'monitor', 'tablet',
        // laptop sub-categories per spec, used for the `laptopCategory` field below
      ],
      default: 'laptop',
      index: true,
    },
    laptopCategory: {
      type: String,
      enum: ['Student', 'Business', 'Programming', 'Gaming', 'Creator', 'Professional', 'Ultrabook', 'Workstation', '2-in-1', 'Budget'],
    },
    availability: { type: String, enum: ['In Stock', 'Out of Stock', 'Pre-order', 'Discontinued'], default: 'In Stock' },

    // --- B. Price / commercial data (numeric, never a formatted string) ---
    price: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, default: 'INR' },
    originalPrice: { type: Number, min: 0 },

    image: { type: String, default: '' },
    description: { type: String, default: '' },

    // --- Existing simple specs (UI-facing, unchanged) ---
    specifications: { type: specificationsSchema, required: true },

    // --- Detailed spec categories (additive) ---
    processorDetails: processorDetailsSchema,
    graphicsDetails: { type: graphicsDetailsSchema, index: false },
    memoryDetails: memoryDetailsSchema,
    storageDetails: storageDetailsSchema,
    displayDetails: displayDetailsSchema,
    batteryDetails: batteryDetailsSchema,
    ports: portsSchema,
    connectivity: connectivitySchema,
    camera: cameraSchema,
    audio: audioSchema,
    keyboardTouchpad: keyboardTouchpadSchema,
    physical: physicalSchema,
    cooling: coolingSchema,
    security: securitySchema,
    upgradeability: upgradeabilitySchema,
    softwareFeatures: softwareFeaturesSchema,
    accessories: accessoriesSchema,
    warranty: warrantySchema,
    source: sourceSchema,

    useCases: [
      {
        type: String,
        enum: ['programming', 'gaming', 'student', 'business', 'video-editing', 'general'],
      },
    ],
    // Broader recommendation tags per Part 2W, in addition to the six
    // simple useCases the scoring engine already understands.
    suitableFor: [
      {
        type: String,
        enum: [
          'Student', 'Programming', 'Web Development', 'Gaming', 'Video Editing',
          'Photo Editing', '3D Modeling', 'AI/ML', 'Data Science', 'Office',
          'Business', 'Content Creation', 'Travel',
        ],
      },
    ],

    rating: { type: Number, min: 0, max: 5, default: 0, index: true },
    reviewCount: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes chosen for actual query patterns (filtering/sorting), not
// applied blindly to every field.
productSchema.index({ name: 'text', brand: 'text', tags: 'text' });
productSchema.index({ 'memoryDetails.capacityGB': 1 });
productSchema.index({ 'storageDetails.capacityGB': 1 });
productSchema.index({ 'displayDetails.refreshRateHz': 1 });
productSchema.index({ 'displayDetails.sizeInches': 1 });
productSchema.index({ 'graphicsDetails.performanceTier': 1 });

productSchema.virtual('discountPercent').get(function computeDiscount() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
