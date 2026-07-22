# Dynamic Pricing - Technologies & Calculations

## Technologies Stack

### Backend Technologies
1. **Node.js** - Runtime environment
2. **Next.js 15** - Full-stack React framework
3. **Prisma ORM** - Database ORM for PostgreSQL
4. **PostgreSQL** - Relational database
5. **Node-cron** - Scheduled task automation (currently disabled)

### Frontend Technologies
1. **React 19** - UI library
2. **Next.js App Router** - Server-side rendering
3. **Tailwind CSS** - Styling
4. **Lucide React** - Icons

### No Machine Learning
- ❌ No ML models
- ❌ No training required
- ✅ Pure rule-based algorithm
- ✅ Mathematical formulas only

---

## Database Schema

### 1. Product Table
```prisma
model Product {
  id               String
  name             String
  basePrice        Float    // Original reference price (never changes)
  currentPrice     Float    // Active selling price (updated by pricing engine)
  minPrice         Float    // Minimum allowed price
  maxPrice         Float    // Maximum allowed price
  stock            Int      // Current inventory level
  maxStock         Int      // Maximum inventory capacity
  category         String
  sales            Int      // Total sales count
  
  // Relations
  demandMetrics    DemandMetrics?
  competitorPrices CompetitorPrice[]
  priceHistory     PriceHistory[]
}
```

### 2. DemandMetrics Table
```prisma
model DemandMetrics {
  id            String
  productId     String   @unique
  viewCount     Int      @default(0)      // Product page views
  cartAddCount  Int      @default(0)      // Times added to cart
  purchaseCount Int      @default(0)      // Completed purchases
  lastViewed    DateTime?
  lastUpdated   DateTime @updatedAt
}
```

### 3. CompetitorPrice Table
```prisma
model CompetitorPrice {
  id             String
  productId      String
  competitorName String
  price          Float
  url            String?
  lastChecked    DateTime @default(now())
}
```

### 4. PriceHistory Table
```prisma
model PriceHistory {
  id          String
  productId   String
  oldPrice    Float
  newPrice    Float
  reason      String   // "stock_low", "demand_high", "manual", "auto_update"
  stockLevel  Int?
  demandScore Float?
  timestamp   DateTime @default(now())
}
```

### 5. PricingConfig Table
```prisma
model PricingConfig {
  id                   String
  stockWeight          Float    @default(0.3)    // 30% weight
  demandWeight         Float    @default(0.4)    // 40% weight
  competitorWeight     Float    @default(0.3)    // 30% weight
  maxIncreasePercent   Float    @default(50)     // Max 50% increase
  maxDecreasePercent   Float    @default(30)     // Max 30% decrease
  minProfitMargin      Float    @default(10)     // Min 10% profit
  updateFrequencyHours Int      @default(6)      // Update every 6 hours
}
```

---

## How Demand Metrics Are Calculated

### Tracking Events
Demand is tracked through 3 user actions:

#### 1. **View Event** (Product Page Visit)
```javascript
// Triggered when user visits product page
POST /api/demand/track
Body: { productId: "abc123", event: "view" }

// Database update:
DemandMetrics.viewCount += 1
DemandMetrics.lastViewed = new Date()
```

#### 2. **Cart Add Event** (Add to Cart)
```javascript
// Triggered when user adds product to cart
POST /api/demand/track
Body: { productId: "abc123", event: "cart_add" }

// Database update:
DemandMetrics.cartAddCount += 1
```

#### 3. **Purchase Event** (Order Completion)
```javascript
// Triggered when order is confirmed
POST /api/demand/track
Body: { productId: "abc123", event: "purchase" }

// Database update:
DemandMetrics.purchaseCount += quantity
DemandMetrics.cartAddCount += quantity  // Also counts as cart add
```

### Demand Score Calculation
```javascript
// From pricingEngine.js
const purchaseCount = product.demandMetrics?.purchaseCount || 0;
const cartAddCount  = product.demandMetrics?.cartAddCount  || 0;
const viewCount     = product.demandMetrics?.viewCount     || 0;

// Weighted demand calculation
const rawDemand = 
  purchaseCount * 1.0 +    // Purchases have highest weight
  cartAddCount  * 0.3 +    // Cart adds have medium weight
  viewCount     * 0.05;    // Views have lowest weight

// Normalize to 0-1 scale (150 is the normalization factor)
const normalizedDemandScore = Math.min(rawDemand / 150, 1);
```

**Example:**
- Product has: 10 purchases, 30 cart adds, 200 views
- Raw demand = (10 × 1.0) + (30 × 0.3) + (200 × 0.05) = 10 + 9 + 10 = 29
- Normalized = min(29 / 150, 1) = 0.193 (19.3% demand score)

---

## How Stock Levels Are Calculated

### Stock Management

#### 1. **Initial Stock Setup**
```javascript
// When product is created
Product.stock = 100        // Current inventory
Product.maxStock = 100     // Maximum capacity
```

#### 2. **Stock Depletion** (Currently NOT Implemented)
```javascript
// ⚠️ MISSING FEATURE: Stock is NOT reduced on purchase
// Expected behavior (not implemented):
when order is confirmed:
  for each item in order:
    Product.stock -= item.quantity
```

**Current Issue:** Stock levels remain static and don't decrease with purchases.

#### 3. **Stock Score Calculation**
```javascript
// From pricingEngine.js
const stockScore = product.stock / (product.maxStock || 100);

// Examples:
// - Full stock: 100/100 = 1.0 (100%)
// - Half stock: 50/100 = 0.5 (50%)
// - Low stock: 10/100 = 0.1 (10%)
```

---

## Dynamic Pricing Algorithm

### Complete Formula

```javascript
// 1. Calculate demand score (0-1)
const normalizedDemandScore = Math.min(rawDemand / 150, 1);

// 2. Calculate stock score (0-1)
const stockScore = product.stock / product.maxStock;

// 3. Calculate competitor ratio
const competitorAvg = average(competitorPrices);
const competitorRatio = competitorAvg / product.basePrice;

// 4. Get market trend score from ABO dataset
const marketTrendScore = marketTrends[category]?.market_trend_score || 0;
const normalizedMarketScore = clamp(marketTrendScore * 0.05, -0.3, 0.3);

// 5. Build price multiplier
let priceMultiplier = 1;
priceMultiplier += normalizedDemandScore * config.demandWeight;      // +40% max
priceMultiplier -= stockScore * config.stockWeight;                  // -30% max
priceMultiplier += (competitorRatio - 1) * config.competitorWeight;  // ±30% max
priceMultiplier += normalizedMarketScore;                            // ±30% max

// 6. Apply constraints
const maxMultiplier = 1 + config.maxIncreasePercent / 100;  // 1.5 (150%)
const minMultiplier = 1 - config.maxDecreasePercent / 100;  // 0.7 (70%)
priceMultiplier = clamp(priceMultiplier, minMultiplier, maxMultiplier);

// 7. Calculate new price
let newPrice = product.basePrice * priceMultiplier;

// 8. Enforce minimum profit margin
const minPrice = product.basePrice / (1 + config.minProfitMargin / 100);
newPrice = Math.max(newPrice, minPrice);

// 9. Round to 2 decimals
newPrice = Math.round(newPrice * 100) / 100;
```

### Example Calculation

**Product:** Laptop  
**Base Price:** $1000  
**Current Stock:** 20/100 (20%)  
**Demand:** 15 purchases, 40 cart adds, 300 views  

**Step 1: Demand Score**
```
rawDemand = (15 × 1.0) + (40 × 0.3) + (300 × 0.05) = 15 + 12 + 15 = 42
normalizedDemand = min(42 / 150, 1) = 0.28
```

**Step 2: Stock Score**
```
stockScore = 20 / 100 = 0.20
```

**Step 3: Competitor Ratio**
```
competitorAvg = $950
competitorRatio = 950 / 1000 = 0.95
```

**Step 4: Market Trend**
```
marketTrendScore = +4.65 (Laptops are trending up)
normalizedMarket = 4.65 × 0.05 = 0.23
```

**Step 5: Price Multiplier**
```
multiplier = 1
multiplier += 0.28 × 0.4 = 1.112  (demand pushes UP)
multiplier -= 0.20 × 0.3 = 1.052  (low stock pushes UP)
multiplier += (0.95 - 1) × 0.3 = 1.037  (competitor price pushes DOWN)
multiplier += 0.23 = 1.267  (market trend pushes UP)
```

**Step 6: Apply Constraints**
```
maxMultiplier = 1.5
minMultiplier = 0.7
multiplier = clamp(1.267, 0.7, 1.5) = 1.267
```

**Step 7: New Price**
```
newPrice = 1000 × 1.267 = $1267
```

**Step 8: Profit Margin Check**
```
minPrice = 1000 / 1.10 = $909.09
newPrice = max(1267, 909.09) = $1267 ✓
```

**Final Price:** $1267 (26.7% increase from base price)

---

## Price Update Flow

### Manual Update (Admin)
```
1. Admin visits /pricing dashboard
2. Clicks edit icon on product
3. Enters new price
4. System calls: PUT /api/pricing/update/{productId}
5. Database updates: Product.currentPrice = newPrice
6. Price history logged with reason: "manual_admin"
7. Frontend refreshes to show new price
```

### Automated Update (Currently Disabled)
```
1. Scheduler runs every 30 minutes (DISABLED)
2. Fetches all products with demand metrics
3. For each product:
   - Calculate new price using formula
   - If price changed by >$0.01:
     - Update Product.currentPrice
     - Log to PriceHistory
4. Return results summary
```

---

## API Endpoints

### Demand Tracking
```
POST /api/demand/track
Body: { productId: string, event: "view" | "cart_add" | "purchase" }
Response: { success: boolean }
```

### Pricing Analytics (Admin Only)
```
GET /api/pricing/analytics
Response: {
  totalProducts: number,
  avgBasePrice: number,
  avgCurrentPrice: number,
  priceChanges: number,
  topDemandProducts: Product[],
  lowStockProducts: Product[]
}
```

### Manual Price Update (Admin Only)
```
PUT /api/pricing/update/{productId}
Body: { newPrice: number, reason?: string }
Response: Product
```

### Bulk Price Update (Admin Only)
```
POST /api/pricing/update-all
Response: { success: number, failed: number, results: [] }
```

---

## Configuration

### Default Weights
- **Demand Weight:** 40% (highest priority)
- **Stock Weight:** 30%
- **Competitor Weight:** 30%

### Safety Constraints
- **Max Price Increase:** 50% above base price
- **Max Price Decrease:** 30% below base price
- **Min Profit Margin:** 10%

### Update Frequency
- **Automated:** Every 30 minutes (currently disabled)
- **Manual:** On-demand via admin dashboard

---

## Market Trends Data

### Source
- **File:** `market_trends.json` (currently missing)
- **Data:** Pre-calculated category statistics from ABO dataset
- **Format:**
```json
{
  "Laptops": {
    "market_trend_score": 4.65,
    "avg_price": 899.99,
    "demand_index": 0.85
  },
  "Food": {
    "market_trend_score": -0.87,
    "avg_price": 12.99,
    "demand_index": 0.45
  }
}
```

### Usage
- Positive score → Category trending up → Price increase
- Negative score → Category trending down → Price decrease
- Normalized to ±30% max impact

---

## Frontend Display

### Shopping Page
```javascript
// Shows dynamic pricing with strikethrough
<span className="text-2xl font-bold">
  ${product.currentPrice.toFixed(2)}
</span>
{product.currentPrice !== product.basePrice && (
  <span className="text-sm text-gray-400 line-through">
    ${product.basePrice.toFixed(2)}
  </span>
)}
```

**Example Display:**
```
$89.99  $99.99
  ↑       ↑
current  base (strikethrough)
```

---

## Summary

### Technologies
✅ Node.js + Next.js + Prisma + PostgreSQL  
✅ React + Tailwind CSS  
❌ No ML/AI models  
❌ No training required  

### Demand Calculation
✅ Tracked via 3 events: view, cart_add, purchase  
✅ Weighted formula: purchases (1.0) > cart adds (0.3) > views (0.05)  
✅ Normalized to 0-1 scale  

### Stock Calculation
✅ Simple ratio: current stock / max stock  
⚠️ NOT reduced on purchase (missing feature)  
✅ Used in pricing formula  

### Pricing Algorithm
✅ Multi-factor weighted formula  
✅ 4 inputs: demand, stock, competitors, market trends  
✅ Safety constraints: max ±50%, min 10% profit  
✅ Pure mathematics, no ML  

### Current Status
✅ Fully implemented and operational  
✅ Manual pricing enabled  
❌ Automated pricing disabled  
⚠️ Stock depletion not implemented  
