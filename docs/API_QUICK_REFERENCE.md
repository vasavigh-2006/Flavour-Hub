# API Endpoints - Quick Reference

**Base URL:** `http://localhost:5000`

---

## 🔍 Health Check
```
GET  /health
```

---

## 🔐 Authentication (`/api/auth`)
```
POST   /api/auth/register
GET    /api/auth/verify-email?token=TOKEN
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout          [Auth]
GET    /api/auth/me              [Auth]
PUT    /api/auth/me              [Auth]
```

---

## 📚 Recipes (`/api/recipes`)
```
GET    /api/recipes                          [Query: page, limit, category, cuisine, search, sort]
GET    /api/recipes/saved                    [Auth]
GET    /api/recipes/:id/saved                 [Auth]
GET    /api/recipes/:id
POST   /api/recipes                           [Auth] [Multipart]
PUT    /api/recipes/:id                       [Auth] [Multipart]
DELETE /api/recipes/:id                       [Auth]
POST   /api/recipes/:id/like                  [Auth]
POST   /api/recipes/:id/save                  [Auth]
DELETE /api/recipes/:id/save                  [Auth]
POST   /api/recipes/:id/comment               [Auth]
```

---

## 🤖 AI Assistant (`/api/ai`)
```
GET  /api/ai/status
POST /api/ai/chat
POST /api/ai/simplify
POST /api/ai/create-recipe
```

---

## 🎯 Generator - Premium (`/api/generator`)
```
POST /api/generator                           [Auth] [Premium]
POST /api/generator/shopping-list             [Auth] [Premium]
GET  /api/generator/substitutions?ingredient=X [Auth] [Premium]
```

---

## 🌐 TheMealDB (`/api/external/mealdb`)
```
GET /api/external/mealdb/categories
GET /api/external/mealdb/meals/:id
GET /api/external/mealdb/search?s=QUERY
```

---

## 💳 Stripe (`/api/webhooks/stripe`)
```
POST /api/webhooks/stripe/create-checkout-session  [Auth]
POST /api/webhooks/stripe/webhook
POST /api/webhooks/stripe/cancel                   [Auth]
```

---

## 📄 Export - Premium (`/api/export`)
```
GET  /api/export/recipe/:id/pdf              [Auth] [Premium]
POST /api/export/grocery-list/csv            [Auth] [Premium]
```

---

## 👨‍💼 Admin (`/api/admin`)
```
GET /api/admin/stats                          [Auth] [Admin]
GET /api/admin/subscribers                     [Auth] [Admin]
GET /api/admin/reports                         [Auth] [Admin]
PUT /api/admin/reports/:id                    [Auth] [Admin]
```

---

## Legend
- `[Auth]` - Requires authentication
- `[Premium]` - Requires premium subscription
- `[Admin]` - Requires admin role
- `[Multipart]` - Uses multipart/form-data
- `[Query]` - Supports query parameters

---

## Total: 38 Endpoints

**Breakdown:**
- Public: 15 endpoints
- Auth Required: 15 endpoints
- Premium: 5 endpoints
- Admin: 4 endpoints

