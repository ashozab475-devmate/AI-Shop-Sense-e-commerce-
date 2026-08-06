# ShopSense — MVC Architecture

This Next.js project follows the **Model-View-Controller (MVC)** pattern adapted for the App Router.

---

## Folder Structure

```
├── app/                         # VIEW layer
│   ├── api/                     # Route handlers (thin wrappers only)
│   │   ├── signin/route.js      # → calls AuthController
│   │   ├── signup/route.js      # → calls AuthController
│   │   ├── products/route.js    # → calls ProductController
│   │   └── ...
│   ├── shopping/page.js         # React view (shopping page)
│   ├── sign_in/page.js          # React view (login page)
│   ├── components/              # Shared view components
│   └── ...
│
├── lib/                         # MODEL + CONTROLLER layer
│   ├── models/                  # MODEL — Prisma + business logic
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── ...
│   ├── controllers/             # CONTROLLER — request/response logic
│   │   ├── AuthController.js
│   │   ├── ProductController.js
│   │   └── ...
│   ├── services/                # SERVICE — shared/reusable logic
│   │   ├── PricingService.js
│   │   └── ...
│   ├── validators/              # INPUT VALIDATION
│   │   └── ...
│   ├── prisma.js                # Prisma client singleton
│   └── ...
│
├── prisma/
│   └── schema.prisma            # Database schema (Model definitions)
```

---

## How MVC Maps to Next.js

| MVC Layer      | Next.js Equivalent                                      |
|----------------|---------------------------------------------------------|
| **Model**      | `lib/models/*.js` — Prisma queries + data logic         |
| **View**       | `app/**/page.js` — React components + UI                |
| **Controller** | `lib/controllers/*.js` — business rules + API handlers  |
| **Route**      | `app/api/**/route.js` — thin dispatcher (calls Controller) |

---

## Layers Explained

### Model (`lib/models/`)
- Encapsulates all database operations via Prisma
- Contains business logic specific to an entity
- No HTTP/request knowledge — pure data layer

```js
// Example: lib/models/User.js
export class UserModel {
  static async findByEmail(email) { ... }
  static async create(data) { ... }
  static async verifyPassword(plain, hashed) { ... }
}
```

### Controller (`lib/controllers/`)
- Orchestrates Models to fulfil a request
- Handles input validation and error mapping
- Returns plain objects (no NextResponse)

```js
// Example: lib/controllers/AuthController.js
export class AuthController {
  static async signIn({ email, password, loginAs }) {
    const user = await UserModel.findByEmail(email);
    // ... validation logic
    return { success: true, user, token };
  }
}
```

### Service (`lib/services/`)
- Cross-entity business logic
- Used by multiple controllers

```js
// Example: lib/services/PricingService.js
export class PricingService {
  static async calculatePrice(productId) { ... }
  static async updateAllPrices() { ... }
}
```

### View (`app/**/page.js`)
- React components — presentation only
- Fetches data from API routes or uses server components

### Route Handler (`app/api/**/route.js`)
- Thin HTTP dispatcher only
- Parses request → calls Controller → returns NextResponse

```js
// Example: app/api/signin/route.js
export async function POST(req) {
  const body = await req.json();
  const result = await AuthController.signIn(body);  // ← delegates to controller
  return NextResponse.json(result, { status: result.status });
}
```

---

## Data Flow

```
Browser Request
    │
    ▼
app/api/**/route.js      (Route — parses HTTP, dispatches)
    │
    ▼
lib/controllers/**       (Controller — business rules, validation)
    │
    ▼
lib/models/**            (Model — database queries via Prisma)
    │
    ▼
prisma/schema.prisma     (Database schema)
    │
    ▼ (response flows back up)
app/**/page.js           (View — renders data as UI)
```
