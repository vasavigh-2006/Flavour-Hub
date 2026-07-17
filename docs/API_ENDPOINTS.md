# API Endpoints - Complete Reference

**Base URL:** `http://localhost:5000`  
**API Prefix:** `/api`

---

## 📋 Table of Contents

1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Recipes](#recipes)
4. [AI Assistant](#ai-assistant)
5. [Recipe Generator (Premium)](#recipe-generator-premium)
6. [TheMealDB Proxy](#themedb-proxy)
7. [Stripe Payments](#stripe-payments)
8. [Export (Premium)](#export-premium)
9. [Admin](#admin)

---

## 🔍 Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Check server status |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔐 Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/auth/register` | ❌ | ✅ | Register new user |
| GET | `/api/auth/verify-email` | ❌ | ❌ | Verify email address |
| POST | `/api/auth/login` | ❌ | ✅ | Login user |
| POST | `/api/auth/refresh` | ❌ | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | ❌ | Logout user |
| GET | `/api/auth/me` | ✅ | ❌ | Get current user profile |
| PUT | `/api/auth/me` | ✅ | ❌ | Update user profile |

### Request Examples

**Register:**
```json
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Update Profile:**
```json
PUT /api/auth/me
{
  "username": "new_username",
  "bio": "Updated bio",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## 📚 Recipes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recipes` | ❌ | Get all recipes (with filters) |
| GET | `/api/recipes/saved` | ✅ | Get saved recipes |
| GET | `/api/recipes/:id/saved` | ✅ | Check if recipe is saved |
| GET | `/api/recipes/:id` | ❌ | Get recipe by ID |
| POST | `/api/recipes` | ✅ | Create new recipe |
| PUT | `/api/recipes/:id` | ✅ | Update recipe (owner/admin) |
| DELETE | `/api/recipes/:id` | ✅ | Delete recipe (owner/admin) |
| POST | `/api/recipes/:id/like` | ✅ | Like/unlike recipe |
| POST | `/api/recipes/:id/save` | ✅ | Save recipe to favorites |
| DELETE | `/api/recipes/:id/save` | ✅ | Remove recipe from saved |
| POST | `/api/recipes/:id/comment` | ✅ | Add comment to recipe |

### Query Parameters (GET /api/recipes)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `category` - Filter by category
- `cuisine` - Filter by cuisine
- `search` - Search term
- `sort` - Sort order (`newest`, `oldest`, `popular`)

### Request Examples

**Get Recipes with Filters:**
```
GET /api/recipes?category=dinner&page=1&limit=10&sort=popular
```

**Create Recipe:**
```json
POST /api/recipes
Content-Type: multipart/form-data

{
  "title": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "ingredients": "[{\"name\":\"pasta\",\"amount\":\"500g\"}]",
  "instructions": "Cook pasta...",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "difficulty": "medium",
  "category": "dinner",
  "cuisine": "italian",
  "images": [file1, file2]
}
```

**Add Comment:**
```json
POST /api/recipes/:id/comment
{
  "text": "Great recipe! Loved it!"
}
```

---

## 🤖 AI Assistant

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| GET | `/api/ai/status` | ❌ | ❌ | Check Ollama service status |
| POST | `/api/ai/chat` | ❌ | ✅ | Chat with AI assistant |
| POST | `/api/ai/simplify` | ❌ | ✅ | Simplify a recipe using AI |
| POST | `/api/ai/create-recipe` | ❌ | ✅ | Create recipe from ingredients using AI |

### Request Examples

**AI Chat:**
```json
POST /api/ai/chat
{
  "message": "How do I make pasta?",
  "conversationHistory": []
}
```

**Simplify Recipe:**
```json
POST /api/ai/simplify
{
  "recipeData": {
    "strMeal": "Recipe Name",
    "strInstructions": "Complex instructions...",
    "ingredients": "List of ingredients"
  }
}
```

**Create Recipe from Ingredients:**
```json
POST /api/ai/create-recipe
{
  "ingredients": ["chicken", "rice", "vegetables"]
}
```

### Response Examples

**AI Chat Success:**
```json
{
  "success": true,
  "response": "To make pasta, start by boiling water...",
  "model": "llama3.2"
}
```

**AI Status:**
```json
{
  "available": true,
  "models": ["llama3.2", "mistral"],
  "defaultModel": "llama3.2",
  "modelInstalled": true
}
```

---

## 🎯 Recipe Generator (Premium)

| Method | Endpoint | Auth | Premium | Rate Limit | Description |
|--------|----------|------|---------|------------|-------------|
| POST | `/api/generator` | ✅ | ✅ | ✅ | Generate recipe suggestions |
| POST | `/api/generator/shopping-list` | ✅ | ✅ | ❌ | Get shopping list for recipes |
| GET | `/api/generator/substitutions` | ✅ | ✅ | ❌ | Get ingredient substitutions |

### Request Examples

**Generate Suggestions:**
```json
POST /api/generator
{
  "ingredients": "chicken, tomatoes, rice",
  "maxTime": 30,
  "cuisine": "italian",
  "diet": "none",
  "excludeIngredients": ["onions", "garlic"]
}
```

**Shopping List:**
```json
POST /api/generator/shopping-list
{
  "recipeIds": ["recipe_id_1", "recipe_id_2"]
}
```

**Substitutions:**
```
GET /api/generator/substitutions?ingredient=butter
```

### Response Examples

**Generate Suggestions:**
```json
{
  "suggestions": [
    {
      "title": "Chicken Tomato Rice",
      "matchScore": 85,
      "matchedIngredientsCount": 3,
      "missingIngredients": ["olive oil", "salt"],
      "estimatedTime": 25,
      "explanation": "Matched 3 of 5 ingredients. Ready in 25 minutes."
    }
  ]
}
```

---

## 🌐 TheMealDB Proxy

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| GET | `/api/external/mealdb/categories` | ❌ | ✅ | Get all meal categories |
| GET | `/api/external/mealdb/meals/:id` | ❌ | ✅ | Get meal by ID from TheMealDB |
| GET | `/api/external/mealdb/search` | ❌ | ✅ | Search meals |

### Query Parameters

**Search:**
- `s` - Search term (required)

### Request Examples

**Get Categories:**
```
GET /api/external/mealdb/categories
```

**Get Meal by ID:**
```
GET /api/external/mealdb/meals/52772
```

**Search Meals:**
```
GET /api/external/mealdb/search?s=pasta
```

---

## 💳 Stripe Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/stripe/create-checkout-session` | ✅ | Create Stripe checkout session |
| POST | `/api/webhooks/stripe/webhook` | ❌ | Stripe webhook handler |
| POST | `/api/webhooks/stripe/cancel` | ✅ | Cancel premium subscription |

### Request Examples

**Create Checkout Session:**
```json
POST /api/webhooks/stripe/create-checkout-session
{
  "priceId": "price_xxxxx"
}
```

**Cancel Subscription:**
```
POST /api/webhooks/stripe/cancel
```

---

## 📄 Export (Premium)

| Method | Endpoint | Auth | Premium | Description |
|--------|----------|------|---------|-------------|
| GET | `/api/export/recipe/:id/pdf` | ✅ | ✅ | Export recipe as PDF |
| POST | `/api/export/grocery-list/csv` | ✅ | ✅ | Export grocery list as CSV |

### Request Examples

**Export Recipe PDF:**
```
GET /api/export/recipe/:id/pdf
```

**Export Grocery List CSV:**
```json
POST /api/export/grocery-list/csv
{
  "items": [
    {"name": "Chicken", "quantity": "1 lb"},
    {"name": "Rice", "quantity": "2 cups"}
  ]
}
```

---

## 👨‍💼 Admin

| Method | Endpoint | Auth | Admin | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/admin/stats` | ✅ | ✅ | Get admin statistics |
| GET | `/api/admin/subscribers` | ✅ | ✅ | Get all premium subscribers |
| GET | `/api/admin/reports` | ✅ | ✅ | Get all reports |
| PUT | `/api/admin/reports/:id` | ✅ | ✅ | Update report status |

### Request Examples

**Get Stats:**
```
GET /api/admin/stats
```

**Update Report:**
```json
PUT /api/admin/reports/:id
{
  "status": "resolved",
  "notes": "Issue has been fixed"
}
```

---

## 📊 Summary Statistics

| Category | Total Endpoints | Public | Auth Required | Premium | Admin |
|----------|----------------|--------|---------------|---------|-------|
| Health Check | 1 | 1 | 0 | 0 | 0 |
| Authentication | 7 | 3 | 4 | 0 | 0 |
| Recipes | 11 | 2 | 9 | 0 | 0 |
| AI Assistant | 4 | 4 | 0 | 0 | 0 |
| Generator | 3 | 0 | 0 | 3 | 0 |
| TheMealDB | 3 | 3 | 0 | 0 | 0 |
| Stripe | 3 | 1 | 2 | 0 | 0 |
| Export | 2 | 0 | 0 | 2 | 0 |
| Admin | 4 | 0 | 0 | 0 | 4 |
| **TOTAL** | **38** | **15** | **15** | **5** | **4** |

---

## 🔑 Authentication

Most endpoints use **HTTP-only cookies** for authentication. After login, cookies are automatically sent with requests.

**Headers for authenticated requests:**
```
Cookie: accessToken=YOUR_TOKEN
```

Or use `credentials: 'include'` in fetch requests.

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not premium/admin)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (Ollama not running)

---

## 🧪 Quick Test Links

**Browser Testable (GET requests only):**

- Health: `http://localhost:5000/health`
- AI Status: `http://localhost:5000/api/ai/status`
- Recipes: `http://localhost:5000/api/recipes`
- Categories: `http://localhost:5000/api/external/mealdb/categories`
- Search: `http://localhost:5000/api/external/mealdb/search?s=pasta`

For POST/PUT/DELETE requests, use:
- Browser DevTools Console
- Postman/Insomnia
- curl commands
- The `test-api.html` file

---

## 📝 Notes

1. **Rate Limiting:** Some endpoints have rate limiting to prevent abuse
2. **File Uploads:** Recipe creation/update uses `multipart/form-data`
3. **Pagination:** List endpoints support pagination with `page` and `limit`
4. **Filtering:** Recipe endpoints support filtering by category, cuisine, search term
5. **Sorting:** Recipes can be sorted by `newest`, `oldest`, or `popular`
6. **Premium Features:** Generator and Export endpoints require premium subscription
7. **Admin Features:** Admin endpoints require admin role

---

**Last Updated:** 2024

