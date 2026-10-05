// One-off script to populate the database with demo data.
// Run with: npm run seed (from the backend folder)
//
// WARNING:
// This script clears existing Products, Users, and Orders.
// Do not run it against a database containing data you want to keep.

require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// =========================================================
// FALLBACK IMAGE
// =========================================================

const FALLBACK_IMAGE = (name) =>
  `https://placehold.co/600x600/6b6559/faf7f1?text=${encodeURIComponent(
    name
  )}&font=roboto`;

// =========================================================
// FETCH PRODUCT IMAGE
// =========================================================

const fetchProductImage = async (keyword, name) => {
  if (!PEXELS_API_KEY) return FALLBACK_IMAGE(name);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        keyword
      )}&per_page=1&orientation=square`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!res.ok) return FALLBACK_IMAGE(name);

    const data = await res.json();
    const photo = data.photos?.[0];

    return photo?.src?.large || FALLBACK_IMAGE(name);
  } catch {
    return FALLBACK_IMAGE(name);
  }
};

// =========================================================
// PRODUCT DATA
//
// [name, description, price, stock, lowStockThreshold, sku, photoKeyword]
// =========================================================

const RAW_PRODUCTS = {
  // =======================================================
  // ELECTRONICS
  // =======================================================

  Electronics: [
    [
      "Wireless Mechanical Keyboard",
      "Compact 75% layout mechanical keyboard with hot-swappable switches and Bluetooth + USB-C connectivity.",
      4499,
      35,
      10,
      "ELEC-KB-001",
      "mechanical keyboard",
    ],
    [
      "Noise Cancelling Headphones",
      "Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.",
      7999,
      20,
      8,
      "ELEC-HP-002",
      "headphones",
    ],
    [
      "USB-C Fast Charger (65W)",
      "Compact GaN charger with 65W output, compatible with laptops and phones.",
      1899,
      60,
      15,
      "ELEC-CH-003",
      "phone charger",
    ],
    [
      "Portable Bluetooth Speaker",
      "Waterproof speaker with 12-hour playtime and punchy bass for outdoor use.",
      2999,
      6,
      10,
      "ELEC-SPK-004",
      "bluetooth speaker",
    ],
    [
      "Fitness Smart Watch",
      "Heart-rate and sleep tracking, 7-day battery, compatible with iOS and Android.",
      3999,
      0,
      10,
      "ELEC-SW-005",
      "smart watch",
    ],
    [
      "Wireless Gaming Mouse",
      "Ergonomic wireless gaming mouse with adjustable DPI and RGB lighting.",
      2499,
      28,
      8,
      "ELEC-MS-006",
      "gaming mouse",
    ],
    [
      "1080p USB Webcam",
      "Full HD webcam with built-in microphone for video calls and online classes.",
      1999,
      32,
      8,
      "ELEC-WC-007",
      "webcam",
    ],
    [
      "Bluetooth Neckband",
      "Lightweight wireless neckband with deep bass and up to 25 hours of playback.",
      1299,
      45,
      10,
      "ELEC-NB-008",
      "bluetooth neckband",
    ],
    [
      "Portable SSD 1TB",
      "Compact high-speed external SSD with USB-C connectivity.",
      6999,
      14,
      5,
      "ELEC-SSD-009",
      "portable ssd",
    ],
    [
      "USB-C Hub 7-in-1",
      "Multi-port USB-C hub with HDMI, USB, SD card and power delivery support.",
      2799,
      24,
      7,
      "ELEC-HUB-010",
      "usb c hub",
    ],
    [
      "Laptop Stand",
      "Adjustable aluminum laptop stand designed for ergonomic desk setups.",
      1599,
      38,
      10,
      "ELEC-LS-011",
      "laptop stand",
    ],
    [
      "Smart LED Desk Lamp",
      "Dimmable LED desk lamp with adjustable color temperature and touch controls.",
      1799,
      26,
      8,
      "ELEC-LAMP-012",
      "smart desk lamp",
    ],
    [
      "Power Bank 20000mAh",
      "High-capacity power bank with fast charging and dual USB output.",
      2199,
      18,
      7,
      "ELEC-PB-013",
      "power bank",
    ],
    [
      "Wireless Charging Pad",
      "Slim Qi-compatible wireless charging pad for compatible smartphones.",
      999,
      50,
      12,
      "ELEC-WC-014",
      "wireless charging pad",
    ],
    [
      "Smart Plug",
      "Wi-Fi enabled smart plug with mobile app control and scheduling.",
      899,
      42,
      10,
      "ELEC-SP-015",
      "smart plug",
    ],
  ],

  // =======================================================
  // APPAREL
  // =======================================================

  Apparel: [
    [
      "Men's Cotton Casual Shirt",
      "Breathable 100% cotton shirt, regular fit, machine washable.",
      1299,
      45,
      10,
      "APP-SH-001",
      "mens shirt folded",
    ],
    [
      "Women's Running Shoes",
      "Lightweight running shoes with cushioned sole, breathable mesh upper.",
      3499,
      8,
      10,
      "APP-SH-002",
      "running shoes",
    ],
    [
      "Denim Jacket",
      "Classic unisex denim jacket, mid-wash, button front.",
      2599,
      25,
      8,
      "APP-JK-003",
      "denim jacket",
    ],
    [
      "Cotton Hoodie",
      "Heavyweight fleece hoodie with kangaroo pocket, unisex sizing.",
      1899,
      30,
      10,
      "APP-HD-004",
      "hoodie folded",
    ],
    [
      "Ankle Socks (3-Pack)",
      "Breathable cotton-blend ankle socks, cushioned sole.",
      499,
      70,
      15,
      "APP-SK-005",
      "socks pair",
    ],
    [
      "Men's Slim Fit Jeans",
      "Stretch denim jeans with a modern slim fit and five-pocket design.",
      1999,
      36,
      10,
      "APP-JN-006",
      "mens jeans",
    ],
    [
      "Women's Oversized T-Shirt",
      "Soft cotton oversized t-shirt with relaxed everyday styling.",
      899,
      55,
      12,
      "APP-TS-007",
      "oversized tshirt",
    ],
    [
      "Men's Polo T-Shirt",
      "Classic cotton polo shirt suitable for casual and semi-formal wear.",
      1099,
      42,
      10,
      "APP-PO-008",
      "polo shirt",
    ],
    [
      "Women's Denim Jeans",
      "High-rise straight-fit denim jeans with comfortable stretch fabric.",
      2199,
      27,
      8,
      "APP-WJ-009",
      "womens denim jeans",
    ],
    [
      "Unisex Track Pants",
      "Comfortable cotton-blend track pants with elastic waistband.",
      1199,
      40,
      10,
      "APP-TP-010",
      "track pants",
    ],
    [
      "Women's Winter Jacket",
      "Warm padded winter jacket with lightweight insulation.",
      3299,
      16,
      6,
      "APP-WJ-011",
      "winter jacket",
    ],
    [
      "Men's Formal Trousers",
      "Tailored formal trousers made from wrinkle-resistant fabric.",
      1799,
      24,
      7,
      "APP-FT-012",
      "formal trousers",
    ],
    [
      "Cotton Baseball Cap",
      "Adjustable cotton baseball cap with embroidered front logo.",
      699,
      48,
      12,
      "APP-CP-013",
      "baseball cap",
    ],
    [
      "Women's Casual Kurta",
      "Comfortable printed cotton kurta for everyday wear.",
      1399,
      31,
      8,
      "APP-KR-014",
      "womens kurta",
    ],
    [
      "Athletic Training Shorts",
      "Lightweight quick-dry shorts designed for gym and sports training.",
      999,
      44,
      10,
      "APP-SH-015",
      "training shorts",
    ],
  ],

  // =======================================================
  // HOME & KITCHEN
  // =======================================================

  "Home & Kitchen": [
    [
      "Non-Stick Cookware Set (5-Piece)",
      "Induction-friendly non-stick cookware set with tempered glass lids.",
      3299,
      18,
      5,
      "HOME-CK-001",
      "cookware set pots",
    ],
    [
      "Electric Kettle (1.5L)",
      "Stainless steel electric kettle with auto shut-off, 1500W.",
      1499,
      40,
      10,
      "HOME-KT-002",
      "electric kettle",
    ],
    [
      "Memory Foam Pillow",
      "Ergonomic cervical support pillow with cooling gel layer.",
      999,
      5,
      10,
      "HOME-PL-003",
      "pillow",
    ],
    [
      "Handheld Stick Blender",
      "3-in-1 immersion blender with whisk and chopper attachments.",
      1799,
      22,
      8,
      "HOME-BL-004",
      "hand blender kitchen",
    ],
    [
      "Dinner Set (16-Piece)",
      "Stoneware dinner set for 4, microwave and dishwasher safe.",
      2799,
      0,
      6,
      "HOME-DN-005",
      "dinner plate set",
    ],
    [
      "Air Fryer 4L",
      "Digital air fryer with adjustable temperature and timer controls.",
      4999,
      14,
      5,
      "HOME-AF-006",
      "air fryer",
    ],
    [
      "Glass Food Storage Set",
      "Set of airtight glass containers suitable for refrigerator and microwave use.",
      1299,
      30,
      8,
      "HOME-FS-007",
      "glass food containers",
    ],
    [
      "Stainless Steel Lunch Box",
      "Three-compartment stainless steel lunch box with leak-resistant lid.",
      899,
      46,
      10,
      "HOME-LB-008",
      "stainless lunch box",
    ],
    [
      "Electric Rice Cooker",
      "Automatic rice cooker with keep-warm function and non-stick inner pot.",
      2499,
      21,
      7,
      "HOME-RC-009",
      "rice cooker",
    ],
    [
      "Cotton Bedsheet Set",
      "Soft double-bed cotton bedsheet with matching pillow covers.",
      1599,
      34,
      9,
      "HOME-BS-010",
      "cotton bedsheet",
    ],
    [
      "LED Ceiling Light",
      "Energy-efficient LED ceiling light suitable for bedrooms and living rooms.",
      1299,
      29,
      8,
      "HOME-LT-011",
      "ceiling light",
    ],
    [
      "Vacuum Storage Bags",
      "Reusable vacuum storage bags for clothes, bedding and seasonal items.",
      799,
      52,
      12,
      "HOME-VB-012",
      "vacuum storage bags",
    ],
    [
      "Ceramic Coffee Mug Set",
      "Set of four ceramic mugs with minimalist modern design.",
      699,
      40,
      10,
      "HOME-MG-013",
      "ceramic coffee mugs",
    ],
    [
      "Kitchen Knife Set",
      "Stainless steel kitchen knife set with ergonomic handles.",
      1199,
      25,
      7,
      "HOME-KN-014",
      "kitchen knife set",
    ],
    [
      "Foldable Laundry Basket",
      "Lightweight collapsible laundry basket with durable handles.",
      899,
      33,
      8,
      "HOME-LB-015",
      "laundry basket",
    ],
  ],

  // =======================================================
  // SPORTS & FITNESS
  // =======================================================

  "Sports & Fitness": [
    [
      "Yoga Mat (6mm)",
      "Non-slip textured yoga mat with carry strap, 6mm thickness.",
      899,
      50,
      15,
      "SPRT-YM-001",
      "yoga mat rolled",
    ],
    [
      "Adjustable Dumbbell Set (10kg)",
      "Pair of adjustable dumbbells, 2.5kg to 10kg per hand.",
      5499,
      12,
      5,
      "SPRT-DB-002",
      "dumbbells",
    ],
    [
      "Insulated Water Bottle (1L)",
      "Double-wall stainless steel bottle, keeps drinks cold for 24 hours.",
      799,
      0,
      10,
      "SPRT-WB-003",
      "steel water bottle",
    ],
    [
      "Resistance Bands Set",
      "5 resistance levels with door anchor and carry bag.",
      699,
      45,
      10,
      "SPRT-RB-004",
      "resistance bands",
    ],
    [
      "Football (Size 5)",
      "Match-quality synthetic leather football, all-weather use.",
      1199,
      9,
      10,
      "SPRT-FB-005",
      "soccer ball",
    ],
    [
      "Cricket Bat",
      "English willow-style cricket bat suitable for recreational and club play.",
      2999,
      17,
      5,
      "SPRT-CB-006",
      "cricket bat",
    ],
    [
      "Cricket Ball Pack",
      "Pack of durable leather cricket balls for training and matches.",
      999,
      35,
      8,
      "SPRT-CB-007",
      "cricket balls",
    ],
    [
      "Skipping Rope",
      "Adjustable speed skipping rope with comfortable foam handles.",
      399,
      65,
      15,
      "SPRT-SR-008",
      "jump rope",
    ],
    [
      "Gym Gloves",
      "Breathable workout gloves with wrist support and padded palms.",
      699,
      38,
      10,
      "SPRT-GG-009",
      "gym gloves",
    ],
    [
      "Foam Roller",
      "High-density foam roller for muscle recovery and mobility exercises.",
      1099,
      27,
      7,
      "SPRT-FR-010",
      "foam roller",
    ],
    [
      "Running Cap",
      "Lightweight moisture-wicking sports cap for outdoor running.",
      599,
      43,
      10,
      "SPRT-RC-011",
      "running cap",
    ],
    [
      "Table Tennis Paddle Set",
      "Two-player table tennis paddle set with balls.",
      899,
      23,
      6,
      "SPRT-TT-012",
      "table tennis paddles",
    ],
    [
      "Football Goal Net",
      "Portable goal net suitable for practice sessions and backyard games.",
      1899,
      11,
      4,
      "SPRT-GN-013",
      "football goal",
    ],
    [
      "Fitness Resistance Tube",
      "Heavy-duty resistance tube with handles for full-body workouts.",
      749,
      34,
      8,
      "SPRT-RT-014",
      "resistance tube",
    ],
    [
      "Sports Duffel Bag",
      "Spacious sports duffel bag with shoe compartment and adjustable strap.",
      1499,
      26,
      7,
      "SPRT-DB-015",
      "sports duffel bag",
    ],
  ],

  // =======================================================
  // BOOKS
  // =======================================================

  Books: [
    [
      "The Silent Orchard",
      "A quiet literary novel about family and memory across three generations.",
      399,
      25,
      8,
      "BOOK-FIC-001",
      "novel book cover",
    ],
    [
      "Everyday Indian Cooking",
      "120 regional recipes for the modern home kitchen.",
      599,
      18,
      6,
      "BOOK-CK-002",
      "cookbook",
    ],
    [
      "Atomic Focus",
      "A practical guide to deep work and building better habits.",
      449,
      30,
      8,
      "BOOK-SH-003",
      "self help book",
    ],
    [
      "The Startup Playbook",
      "Frameworks for early-stage product and go-to-market decisions.",
      549,
      4,
      8,
      "BOOK-BIZ-004",
      "business book",
    ],
    [
      "Python for Beginners",
      "Beginner-friendly introduction to Python programming and problem solving.",
      699,
      35,
      10,
      "BOOK-TECH-005",
      "python programming book",
    ],
    [
      "Data Science Fundamentals",
      "Introduction to statistics, machine learning and data analysis.",
      899,
      22,
      7,
      "BOOK-DS-006",
      "data science book",
    ],
    [
      "Modern Web Development",
      "Practical guide to building modern frontend and backend applications.",
      799,
      19,
      6,
      "BOOK-WEB-007",
      "web development book",
    ],
    [
      "The Psychology of Money",
      "A practical exploration of personal finance and financial behavior.",
      499,
      40,
      10,
      "BOOK-FIN-008",
      "finance book",
    ],
    [
      "Introduction to Algorithms",
      "Foundational concepts and techniques for algorithmic problem solving.",
      1199,
      13,
      5,
      "BOOK-ALG-009",
      "algorithms textbook",
    ],
    [
      "Clean Code Principles",
      "Practical concepts for writing readable and maintainable software.",
      999,
      16,
      5,
      "BOOK-CC-010",
      "software engineering book",
    ],
    [
      "Machine Learning Simplified",
      "Beginner-oriented introduction to supervised and unsupervised learning.",
      749,
      24,
      7,
      "BOOK-ML-011",
      "machine learning book",
    ],
    [
      "The Art of Productivity",
      "Strategies for managing time, priorities and focused work.",
      449,
      32,
      8,
      "BOOK-PD-012",
      "productivity book",
    ],
  ],

  // =======================================================
  // BEAUTY & PERSONAL CARE
  // =======================================================

  "Beauty & Personal Care": [
    [
      "Gentle Foaming Face Wash",
      "Sulfate-free daily cleanser for all skin types, 150ml.",
      349,
      55,
      15,
      "BEAU-FW-001",
      "face wash bottle",
    ],
    [
      "Argan Oil Shampoo",
      "Sulfate-free shampoo for dry and frizzy hair, 300ml.",
      429,
      40,
      10,
      "BEAU-SH-002",
      "shampoo bottle",
    ],
    [
      "Signature Eau de Parfum",
      "Long-lasting unisex fragrance, woody-citrus notes, 50ml.",
      1899,
      3,
      6,
      "BEAU-PF-003",
      "perfume bottle",
    ],
    [
      "Vitamin C Serum",
      "Brightening face serum with 10% vitamin C, 30ml.",
      699,
      20,
      8,
      "BEAU-SR-004",
      "serum dropper bottle",
    ],
    [
      "Moisturizing Face Cream",
      "Lightweight daily moisturizer suitable for normal and dry skin.",
      499,
      48,
      12,
      "BEAU-MC-005",
      "moisturizer jar",
    ],
    [
      "Sunscreen SPF 50",
      "Broad-spectrum SPF 50 sunscreen with lightweight non-greasy finish.",
      599,
      60,
      15,
      "BEAU-SC-006",
      "sunscreen bottle",
    ],
    [
      "Beard Grooming Oil",
      "Nourishing beard oil with lightweight botanical oils.",
      449,
      37,
      10,
      "BEAU-BO-007",
      "beard oil",
    ],
    [
      "Body Wash 500ml",
      "Refreshing daily body wash with a mild fragrance.",
      399,
      43,
      10,
      "BEAU-BW-008",
      "body wash bottle",
    ],
    [
      "Hair Styling Wax",
      "Medium-hold styling wax with matte finish.",
      349,
      29,
      8,
      "BEAU-HW-009",
      "hair wax",
    ],
    [
      "Lip Balm Pack",
      "Pack of moisturizing lip balms for daily use.",
      249,
      70,
      15,
      "BEAU-LB-010",
      "lip balm",
    ],
    [
      "Clay Face Mask",
      "Purifying clay mask designed for weekly skincare routines.",
      399,
      34,
      9,
      "BEAU-FM-011",
      "clay face mask",
    ],
    [
      "Aloe Vera Gel",
      "Cooling multipurpose aloe vera gel for skin and hair care.",
      299,
      52,
      12,
      "BEAU-AG-012",
      "aloe vera gel",
    ],
  ],

  // =======================================================
  // GROCERIES
  // =======================================================

  Groceries: [
    [
      "Arabica Coffee Beans (500g)",
      "Single-origin medium roast, whole bean.",
      649,
      35,
      10,
      "GROC-CF-001",
      "coffee beans bag",
    ],
    [
      "Cold-Pressed Olive Oil (1L)",
      "Extra virgin, first cold press, glass bottle.",
      899,
      28,
      8,
      "GROC-OL-002",
      "olive oil bottle",
    ],
    [
      "Multigrain Breakfast Cereal",
      "High-fibre cereal blend, no added sugar, 500g.",
      299,
      0,
      10,
      "GROC-CR-003",
      "cereal box",
    ],
    [
      "Organic Honey (500g)",
      "Raw, unprocessed, single-source honey.",
      449,
      42,
      10,
      "GROC-HN-004",
      "honey jar",
    ],
    [
      "Basmati Rice (5kg)",
      "Long-grain aged basmati rice suitable for everyday cooking.",
      699,
      25,
      8,
      "GROC-RC-005",
      "basmati rice bag",
    ],
    [
      "Whole Wheat Flour (5kg)",
      "Stone-ground whole wheat flour for everyday Indian cooking.",
      399,
      44,
      10,
      "GROC-WF-006",
      "wheat flour bag",
    ],
    [
      "Green Tea Bags",
      "Refreshing green tea bags with a light natural flavor.",
      249,
      58,
      12,
      "GROC-GT-007",
      "green tea box",
    ],
    [
      "Peanut Butter (1kg)",
      "Creamy roasted peanut butter with no artificial colors.",
      599,
      31,
      8,
      "GROC-PB-008",
      "peanut butter jar",
    ],
    [
      "Dark Chocolate Bar",
      "Premium dark chocolate bar with rich cocoa flavor.",
      199,
      65,
      15,
      "GROC-DC-009",
      "dark chocolate bar",
    ],
    [
      "Mixed Dry Fruits (500g)",
      "Premium mixture of almonds, cashews, raisins and pistachios.",
      749,
      20,
      6,
      "GROC-DF-010",
      "dry fruits",
    ],
    [
      "Oats (1kg)",
      "Whole-grain rolled oats suitable for breakfast and baking.",
      299,
      50,
      12,
      "GROC-OT-011",
      "oats packet",
    ],
    [
      "Pasta (500g)",
      "Durum wheat pasta suitable for quick everyday meals.",
      149,
      72,
      15,
      "GROC-PA-012",
      "pasta packet",
    ],
  ],

  // =======================================================
  // TOYS & GAMES
  // =======================================================

  "Toys & Games": [
    [
      "Wooden Building Blocks Set",
      "100-piece natural wood blocks for open-ended play, ages 3+.",
      1299,
      15,
      6,
      "TOY-BLK-001",
      "wooden building blocks",
    ],
    [
      "Strategy Board Game",
      "2-4 player strategy game, 45-60 min playtime, ages 10+.",
      1599,
      7,
      8,
      "TOY-BG-002",
      "board game box",
    ],
    [
      "Remote Control Car",
      "1:18 scale RC car, rechargeable battery, 20km/h top speed.",
      2299,
      11,
      6,
      "TOY-RC-003",
      "remote control car toy",
    ],
    [
      "Wooden Puzzle Cube Set",
      "6-piece brain teaser puzzle set for ages 8+.",
      499,
      33,
      10,
      "TOY-PZ-004",
      "wooden puzzle cube",
    ],
    [
      "Classic Chess Set",
      "Classic wooden chess set for casual and competitive play.",
      899,
      25,
      7,
      "TOY-CH-005",
      "wooden chess set",
    ],
    [
      "Magnetic Building Tiles",
      "Colorful magnetic construction tiles for creative building.",
      1799,
      18,
      6,
      "TOY-MT-006",
      "magnetic tiles",
    ],
    [
      "Plush Teddy Bear",
      "Soft plush teddy bear suitable as a gift for children.",
      799,
      30,
      8,
      "TOY-TB-007",
      "teddy bear",
    ],
    [
      "Kids Art Kit",
      "Creative art kit with crayons, pencils, paints and drawing sheets.",
      999,
      28,
      8,
      "TOY-AK-008",
      "kids art supplies",
    ],
    [
      "Mini Building Blocks",
      "Colorful construction block set for creative play.",
      699,
      35,
      10,
      "TOY-MB-009",
      "building blocks toy",
    ],
    [
      "Educational Flash Cards",
      "Illustrated learning flash cards covering numbers, letters and objects.",
      399,
      45,
      10,
      "TOY-FC-010",
      "educational flash cards",
    ],
    [
      "Remote Control Helicopter",
      "Rechargeable mini RC helicopter designed for indoor flying.",
      2499,
      12,
      5,
      "TOY-RH-011",
      "remote control helicopter",
    ],
    [
      "Kids Bowling Set",
      "Colorful lightweight bowling set designed for indoor play.",
      799,
      22,
      6,
      "TOY-BW-012",
      "kids bowling set",
    ],
  ],
};

// =========================================================
// HIGH-DEMAND PRODUCTS
// =========================================================

const HIGH_DEMAND_SKUS = new Set([
  "ELEC-SPK-004",
  "ELEC-SW-005",
  "ELEC-MS-006",
  "APP-SH-002",
  "APP-JN-006",
  "HOME-PL-003",
  "HOME-DN-005",
  "HOME-AF-006",
  "SPRT-WB-003",
  "SPRT-FB-005",
  "SPRT-CB-006",
  "BOOK-BIZ-004",
  "BOOK-DS-006",
  "BEAU-PF-003",
  "BEAU-SC-006",
  "GROC-CR-003",
  "GROC-CF-001",
  "TOY-BG-002",
  "TOY-RC-003",
]);

// =========================================================
// MEDIUM-DEMAND PRODUCTS
// =========================================================

const MEDIUM_DEMAND_SKUS = new Set([
  "ELEC-HP-002",
  "ELEC-CH-003",
  "ELEC-PB-013",
  "APP-HD-004",
  "APP-PO-008",
  "HOME-KT-002",
  "HOME-RC-009",
  "SPRT-DB-002",
  "SPRT-RB-004",
  "BOOK-CK-002",
  "BOOK-TECH-005",
  "BEAU-SR-004",
  "BEAU-MC-005",
  "GROC-HN-004",
  "GROC-PB-008",
  "TOY-RC-003",
  "TOY-MT-006",
]);

// =========================================================
// CREATE HISTORICAL ORDERS
// =========================================================

const createHistoricalOrders = async (customer, products) => {
  const now = new Date();

  const orders = [];

  // -------------------------------------------------------
  // DATE GENERATOR
  // -------------------------------------------------------

  const getDateDaysAgo = (daysAgo) => {
    const date = new Date(now);

    date.setDate(date.getDate() - daysAgo);

    date.setHours(12, 0, 0, 0);

    return date;
  };

  // -------------------------------------------------------
  // DEMAND PROFILE
  // -------------------------------------------------------

  const getDemandMultiplier = (sku) => {
    if (HIGH_DEMAND_SKUS.has(sku)) return 3;

    if (MEDIUM_DEMAND_SKUS.has(sku)) return 2;

    return 1;
  };

  // -------------------------------------------------------
  // DETERMINISTIC QUANTITY VARIATION
  // -------------------------------------------------------

  const getVariation = (index) => {
    const values = [
      0.7,
      0.9,
      1.0,
      1.1,
      1.25,
      0.85,
      1.15,
    ];

    return values[index % values.length];
  };

  // -------------------------------------------------------
  // SYNTHETIC SEASONAL FACTOR
  // -------------------------------------------------------

  const getSeasonalFactor = (daysAgo) => {
    if (daysAgo <= 30) return 1.25;

    if (daysAgo <= 60) return 1.15;

    if (daysAgo <= 90) return 1.05;

    if (daysAgo <= 150) return 0.95;

    if (daysAgo <= 210) return 1.05;

    return 0.9;
  };

  // -------------------------------------------------------
  // DEMAND ACCELERATION / DECLINE
  // -------------------------------------------------------

  const getRecencyFactor = (daysAgo, productIndex) => {
    const product = products[productIndex];

    const accelerating =
      productIndex % 5 === 0 ||
      HIGH_DEMAND_SKUS.has(product.sku);

    const declining =
      productIndex % 11 === 0;

    if (accelerating) {
      if (daysAgo <= 30) return 1.35;

      if (daysAgo <= 90) return 1.15;

      return 0.95;
    }

    if (declining) {
      if (daysAgo <= 30) return 0.75;

      if (daysAgo <= 90) return 0.9;

      return 1.1;
    }

    return 1;
  };

  // -------------------------------------------------------
  // ORDER GENERATION
  //
  // 12 orders per product.
  //
  // 108 products × 12 orders = 1,296 orders.
  // -------------------------------------------------------

  const ORDERS_PER_PRODUCT = 12;

  for (
    let productIndex = 0;
    productIndex < products.length;
    productIndex++
  ) {
    const product = products[productIndex];

    const multiplier =
      getDemandMultiplier(product.sku);

    for (
      let orderNumber = 0;
      orderNumber < ORDERS_PER_PRODUCT;
      orderNumber++
    ) {
      // -----------------------------------------------
      // Spread orders across 270 days
      // -----------------------------------------------

      const baseDaysAgo = Math.floor(
        (orderNumber / ORDERS_PER_PRODUCT) * 270
      );

      const offset =
        (productIndex * 7 + orderNumber * 3) % 18;

      let daysAgo =
        baseDaysAgo + offset;

      daysAgo = Math.min(daysAgo, 269);

      // -----------------------------------------------
      // DEMAND FACTORS
      // -----------------------------------------------

      const seasonalFactor =
        getSeasonalFactor(daysAgo);

      const recencyFactor =
        getRecencyFactor(
          daysAgo,
          productIndex
        );

      const variation = getVariation(
        productIndex + orderNumber
      );

      // -----------------------------------------------
      // BASE QUANTITY
      // -----------------------------------------------

      let baseQuantity =
        1 +
        ((productIndex + orderNumber) % 3);

      // Medium-demand products
      if (multiplier === 2) {
        baseQuantity +=
          1 +
          ((productIndex + orderNumber) % 2);
      }

      // High-demand products
      if (multiplier === 3) {
        baseQuantity +=
          2 +
          ((productIndex + orderNumber) % 3);
      }

      // -----------------------------------------------
      // FINAL QUANTITY
      // -----------------------------------------------

      let quantity =
        baseQuantity *
        variation *
        seasonalFactor *
        recencyFactor;

      quantity = Math.max(
        1,
        Math.round(quantity)
      );

      // Keep individual orders realistic.
      quantity = Math.min(quantity, 15);

      // -----------------------------------------------
      // DATE + TOTAL
      // -----------------------------------------------

      const createdAt =
        getDateDaysAgo(daysAgo);

      const totalAmount =
        product.price * quantity;

      // -----------------------------------------------
      // ORDER STATUS
      // -----------------------------------------------

      let status = "delivered";

      if (
        orderNumber === 0 &&
        productIndex % 7 === 0
      ) {
        status = "confirmed";
      } else if (
        orderNumber === 1 &&
        productIndex % 10 === 0
      ) {
        status = "shipped";
      }

      // -----------------------------------------------
      // ORDER DOCUMENT
      // -----------------------------------------------

      orders.push({
        user: customer._id,

        items: [
          {
            product: product._id,
            name: product.name,
            price: product.price,
            quantity,
          },
        ],

        totalAmount,

        status,

        paymentStatus: "paid",

        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // -------------------------------------------------------
  // INSERT ALL ORDERS
  // -------------------------------------------------------

  await Order.insertMany(orders);

  // -------------------------------------------------------
  // CALCULATE UNITS SOLD
  // -------------------------------------------------------

  const unitsByProduct = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const key =
        item.product.toString();

      unitsByProduct.set(
        key,
        (unitsByProduct.get(key) || 0) +
          item.quantity
      );
    }
  }

  // -------------------------------------------------------
  // UPDATE PRODUCT UNITS SOLD
  // -------------------------------------------------------

  await Promise.all(
    products.map(async (product) => {
      const unitsSold =
        unitsByProduct.get(
          product._id.toString()
        ) || 0;

      await Product.updateOne(
        {
          _id: product._id,
        },
        {
          $set: {
            unitsSold,
          },
        }
      );
    })
  );

  return orders.length;
};

// =========================================================
// SEED DATABASE
// =========================================================

const seed = async () => {
  await connectDB();

  try {
    // -----------------------------------------------------
    // CLEAR DEMO DATA
    // -----------------------------------------------------

    console.log(
      "Clearing existing products, users and orders..."
    );

    await Product.deleteMany({});

    await Order.deleteMany({});

    // -----------------------------------------------------
    // DEMO USERS
    // -----------------------------------------------------

    const demoUsers = [
      {
        name: "Admin User",
        email: "admin@retaildemo.com",
        password: "admin123",
        role: "admin",
      },
      {
        name: "Demo Customer",
        email: "customer@retaildemo.com",
        password: "customer123",
        role: "customer",
      },
    ];

    await User.deleteMany({
      email: {
        $in: demoUsers.map(
          (u) => u.email
        ),
      },
    });

    // -----------------------------------------------------
    // PEXELS WARNING
    // -----------------------------------------------------

    if (!PEXELS_API_KEY) {
      console.log(
        "\nNo PEXELS_API_KEY found in .env - products will use plain fallback tiles instead of real photos.\n"
      );
    }

    console.log(
      "Fetching product photos and inserting products..."
    );

    // -----------------------------------------------------
    // FLATTEN PRODUCTS
    // -----------------------------------------------------

    const flatEntries =
      Object.entries(RAW_PRODUCTS).flatMap(
        ([category, items]) =>
          items.map(
            ([
              name,
              description,
              price,
              stock,
              lowStockThreshold,
              sku,
              keyword,
            ]) => ({
              category,
              name,
              description,
              price,
              stock,
              lowStockThreshold,
              sku,
              keyword,
            })
          )
      );

    const demoProducts = [];

    // -----------------------------------------------------
    // FETCH PRODUCT IMAGES
    // -----------------------------------------------------

    for (const entry of flatEntries) {
      const imageUrl =
        await fetchProductImage(
          entry.keyword,
          entry.name
        );

      demoProducts.push({
        name: entry.name,
        description: entry.description,
        category: entry.category,
        price: entry.price,
        stock: entry.stock,
        lowStockThreshold:
          entry.lowStockThreshold,
        sku: entry.sku,
        imageUrl,
        unitsSold: 0,
      });

      process.stdout.write(".");
    }

    console.log("");

    // -----------------------------------------------------
    // INSERT PRODUCTS
    // -----------------------------------------------------

    const insertedProducts =
      await Product.insertMany(
        demoProducts
      );

    console.log(
      `Products inserted: ${insertedProducts.length}`
    );

    // -----------------------------------------------------
    // CREATE DEMO USERS
    // -----------------------------------------------------

    console.log(
      "Creating demo accounts..."
    );

    const createdUsers = [];

    for (const u of demoUsers) {
      const user = await User.create(u);

      createdUsers.push(user);
    }

    const customerUser =
      createdUsers.find(
        (u) => u.role === "customer"
      );

    // -----------------------------------------------------
    // CREATE HISTORICAL SALES
    // -----------------------------------------------------

    console.log(
      "Creating historical order data..."
    );

    const orderCount =
      await createHistoricalOrders(
        customerUser,
        insertedProducts
      );

    console.log(
      `Historical orders created: ${orderCount}`
    );

    // -----------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------

    const categoryCount =
      Object.keys(RAW_PRODUCTS).length;

    console.log(
      "\n========================================"
    );

    console.log(
      "             SEED COMPLETE"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Products inserted: ${insertedProducts.length}`
    );

    console.log(
      `Categories: ${categoryCount}`
    );

    console.log(
      `Historical orders: ${orderCount}`
    );

    console.log(
      `Average products/category: ${(
        insertedProducts.length /
        categoryCount
      ).toFixed(1)}`
    );

    console.log(
      "========================================"
    );

    console.log(
      "Demo accounts:"
    );

    demoUsers.forEach((u) => {
      console.log(
        `  ${u.role.padEnd(9)} ${u.email} / ${u.password}`
      );
    });

    console.log(
      "========================================"
    );

    console.log(
      "\nChange or remove these demo accounts before any real deployment."
    );
  } catch (err) {
    console.error(
      "Seeding failed:",
      err.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();