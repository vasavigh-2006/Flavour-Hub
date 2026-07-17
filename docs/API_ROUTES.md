# API Routes Documentation

Base URL: `http://localhost:5000` (or your server URL)

All API routes are prefixed with `/api` except the health check endpoint.

---

## Health Check

### GET `/health`
**Description:** Check if server is running  
**Auth:** None  
**Test:**
```bash
curl http://localhost:5000/health
```

---

## Authentication Routes (`/api/auth`)

### POST `/api/auth/register`
**Description:** Register a new user  
**Auth:** None  
**Rate Limit:** Yes (authLimiter)  
**Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### GET `/api/auth/verify-email?token=TOKEN`
**Description:** Verify email address  
**Auth:** None  
**Test:**
```bash
curl "http://localhost:5000/api/auth/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

### POST `/api/auth/login`
**Description:** Login user  
**Auth:** None  
**Rate Limit:** Yes (authLimiter)  
**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### POST `/api/auth/refresh`
**Description:** Refresh access token  
**Auth:** None (uses refresh token from cookies)  
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### POST `/api/auth/logout`
**Description:** Logout user  
**Auth:** Required  
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -b cookies.txt
```

### GET `/api/auth/me`
**Description:** Get current user profile  
**Auth:** Required  
**Test:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -b cookies.txt
```

### PUT `/api/auth/me`
**Description:** Update user profile  
**Auth:** Required  
**Body:**
```json
{
  "username": "newname",
  "bio": "Updated bio"
}
```
**Test:**
```bash
curl -X PUT http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"username":"newname","bio":"Updated bio"}' \
  -b cookies.txt
```

---

## Recipe Routes (`/api/recipes`)

### GET `/api/recipes`
**Description:** Get all recipes with optional filters  
**Auth:** None  
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `category` - Filter by category
- `cuisine` - Filter by cuisine
- `search` - Search term
- `sort` - Sort order (newest, oldest, popular)
**Test:**
```bash
# Get all recipes
curl http://localhost:5000/api/recipes

# With filters
curl "http://localhost:5000/api/recipes?category=dessert&page=1&limit=5"
```

### GET `/api/recipes/:id`
**Description:** Get recipe by ID  
**Auth:** None  
**Test:**
```bash
curl http://localhost:5000/api/recipes/RECIPE_ID
```

### POST `/api/recipes`
**Description:** Create a new recipe  
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Body Fields:**
- `title` - Recipe title (required)
- `description` - Recipe description
- `ingredients` - JSON array of ingredients
- `instructions` - Recipe instructions
- `prepTime` - Preparation time in minutes
- `cookTime` - Cooking time in minutes
- `servings` - Number of servings
- `difficulty` - Difficulty level (easy, medium, hard)
- `category` - Recipe category
- `cuisine` - Cuisine type
- `images` - Image files (up to 5)
**Test:**
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -F "title=Test Recipe" \
  -F "description=Test Description" \
  -F "ingredients=[{\"name\":\"flour\",\"amount\":\"1 cup\"}]" \
  -F "instructions=Step 1: Mix ingredients" \
  -F "prepTime=10" \
  -F "cookTime=20" \
  -F "servings=4" \
  -F "difficulty=easy" \
  -F "category=dinner" \
  -F "cuisine=italian" \
  -F "images=@image.jpg"
```

### PUT `/api/recipes/:id`
**Description:** Update recipe  
**Auth:** Required (owner or admin)  
**Content-Type:** `multipart/form-data`  
**Test:**
```bash
curl -X PUT http://localhost:5000/api/recipes/RECIPE_ID \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -F "title=Updated Title" \
  -F "description=Updated Description"
```

### DELETE `/api/recipes/:id`
**Description:** Delete recipe  
**Auth:** Required (owner or admin)  
**Test:**
```bash
curl -X DELETE http://localhost:5000/api/recipes/RECIPE_ID \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### POST `/api/recipes/:id/like`
**Description:** Like/unlike a recipe  
**Auth:** Required  
**Test:**
```bash
curl -X POST http://localhost:5000/api/recipes/RECIPE_ID/like \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### POST `/api/recipes/:id/save`
**Description:** Save recipe to favorites  
**Auth:** Required  
**Test:**
```bash
curl -X POST http://localhost:5000/api/recipes/RECIPE_ID/save \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### DELETE `/api/recipes/:id/save`
**Description:** Remove recipe from saved  
**Auth:** Required  
**Test:**
```bash
curl -X DELETE http://localhost:5000/api/recipes/RECIPE_ID/save \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### GET `/api/recipes/saved`
**Description:** Get all saved recipes  
**Auth:** Required  
**Test:**
```bash
curl http://localhost:5000/api/recipes/saved \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### GET `/api/recipes/:id/saved`
**Description:** Check if recipe is saved  
**Auth:** Required  
**Test:**
```bash
curl http://localhost:5000/api/recipes/RECIPE_ID/saved \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### POST `/api/recipes/:id/comment`
**Description:** Add comment to recipe  
**Auth:** Required  
**Body:**
```json
{
  "text": "Great recipe!"
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/recipes/RECIPE_ID/comment \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"text":"Great recipe!"}'
```

---

## AI Routes (`/api/ai`)

### GET `/api/ai/status`
**Description:** Check Ollama service status  
**Auth:** None  
**Test:**
```bash
curl http://localhost:5000/api/ai/status
```

### POST `/api/ai/chat`
**Description:** Chat with AI assistant  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Body:**
```json
{
  "message": "How do I make pasta?",
  "conversationHistory": []
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I make pasta?","conversationHistory":[]}'
```

### POST `/api/ai/simplify`
**Description:** Simplify a recipe using AI  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Body:**
```json
{
  "recipeData": {
    "strMeal": "Recipe Name",
    "strInstructions": "Complex instructions...",
    "ingredients": "List of ingredients"
  }
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/ai/simplify \
  -H "Content-Type: application/json" \
  -d '{"recipeData":{"strMeal":"Pasta","strInstructions":"Cook pasta...","ingredients":"pasta, water"}}'
```

### POST `/api/ai/create-recipe`
**Description:** Create recipe from ingredients using AI  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Body:**
```json
{
  "ingredients": ["chicken", "rice", "vegetables"]
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/ai/create-recipe \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["chicken","rice","vegetables"]}'
```

---

## Generator Routes (`/api/generator`) - Premium Only

### POST `/api/generator`
**Description:** Generate recipe suggestions  
**Auth:** Required + Premium  
**Rate Limit:** Yes (generatorLimiter)  
**Body:**
```json
{
  "ingredients": ["chicken", "tomatoes"],
  "maxTime": 30,
  "cuisine": "italian",
  "diet": "none",
  "excludeIngredients": ["onions"]
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/generator \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"ingredients":["chicken","tomatoes"],"maxTime":30}'
```

### POST `/api/generator/shopping-list`
**Description:** Get shopping list for recipes  
**Auth:** Required + Premium  
**Body:**
```json
{
  "recipeIds": ["id1", "id2"]
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/generator/shopping-list \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"recipeIds":["RECIPE_ID_1","RECIPE_ID_2"]}'
```

### GET `/api/generator/substitutions`
**Description:** Get ingredient substitutions  
**Auth:** Required + Premium  
**Test:**
```bash
curl http://localhost:5000/api/generator/substitutions \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## TheMealDB Proxy Routes (`/api/external/mealdb`)

### GET `/api/external/mealdb/categories`
**Description:** Get all meal categories  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Test:**
```bash
curl http://localhost:5000/api/external/mealdb/categories
```

### GET `/api/external/mealdb/meals/:id`
**Description:** Get meal by ID from TheMealDB  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Test:**
```bash
curl http://localhost:5000/api/external/mealdb/meals/52772
```

### GET `/api/external/mealdb/search?s=QUERY`
**Description:** Search meals  
**Auth:** None  
**Rate Limit:** Yes (apiLimiter)  
**Query Parameters:**
- `s` - Search term (required)
**Test:**
```bash
curl "http://localhost:5000/api/external/mealdb/search?s=pasta"
```

---

## Stripe Routes (`/api/webhooks/stripe`)

### POST `/api/webhooks/stripe/create-checkout-session`
**Description:** Create Stripe checkout session for premium subscription  
**Auth:** Required  
**Body:**
```json
{
  "priceId": "price_xxxxx"
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/webhooks/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"priceId":"price_xxxxx"}'
```

### POST `/api/webhooks/stripe/webhook`
**Description:** Stripe webhook handler (called by Stripe)  
**Auth:** None (uses Stripe signature verification)  
**Content-Type:** `application/json` (raw body)  
**Test:** This is typically called by Stripe, but you can test with:
```bash
curl -X POST http://localhost:5000/api/webhooks/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: SIGNATURE" \
  --data-binary @webhook_payload.json
```

### POST `/api/webhooks/stripe/cancel`
**Description:** Cancel premium subscription  
**Auth:** Required + Premium  
**Test:**
```bash
curl -X POST http://localhost:5000/api/webhooks/stripe/cancel \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## Export Routes (`/api/export`) - Premium Only

### GET `/api/export/recipe/:id/pdf`
**Description:** Export recipe as PDF  
**Auth:** Required + Premium  
**Test:**
```bash
curl http://localhost:5000/api/export/recipe/RECIPE_ID/pdf \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  --output recipe.pdf
```

### POST `/api/export/grocery-list/csv`
**Description:** Export grocery list as CSV  
**Auth:** Required + Premium  
**Body:**
```json
{
  "items": [
    {"name": "Chicken", "quantity": "1 lb"},
    {"name": "Rice", "quantity": "2 cups"}
  ]
}
```
**Test:**
```bash
curl -X POST http://localhost:5000/api/export/grocery-list/csv \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"items":[{"name":"Chicken","quantity":"1 lb"}]}' \
  --output grocery-list.csv
```

---

## Admin Routes (`/api/admin`) - Admin Only

### GET `/api/admin/stats`
**Description:** Get admin statistics  
**Auth:** Required + Admin  
**Test:**
```bash
curl http://localhost:5000/api/admin/stats \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### GET `/api/admin/subscribers`
**Description:** Get all premium subscribers  
**Auth:** Required + Admin  
**Test:**
```bash
curl http://localhost:5000/api/admin/subscribers \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### GET `/api/admin/reports`
**Description:** Get all reports  
**Auth:** Required + Admin  
**Test:**
```bash
curl http://localhost:5000/api/admin/reports \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### PUT `/api/admin/reports/:id`
**Description:** Update report status  
**Auth:** Required + Admin  
**Body:**
```json
{
  "status": "resolved",
  "notes": "Issue fixed"
}
```
**Test:**
```bash
curl -X PUT http://localhost:5000/api/admin/reports/REPORT_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"status":"resolved","notes":"Issue fixed"}'
```

---

## Testing Tips

### 1. Using Cookies for Authentication
Save cookies from login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

Then use saved cookies:
```bash
curl http://localhost:5000/api/auth/me -b cookies.txt
```

### 2. Using Postman/Insomnia
- Import the routes as a collection
- Set base URL: `http://localhost:5000`
- For authenticated routes, add cookies from login response
- For file uploads, use form-data with file type

### 3. Testing with JavaScript (fetch)
```javascript
// Login
const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
});

// Use authenticated endpoint
const meRes = await fetch('http://localhost:5000/api/auth/me', {
  credentials: 'include'
});
```

### 4. Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not premium/admin)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Server Error
- `503` - Service Unavailable (Ollama not running)

### 5. Rate Limits
- Auth routes: Limited to prevent brute force
- API routes: General rate limiting
- Generator routes: Stricter limits for premium features

---

## Notes

- All routes return JSON responses
- Authentication uses HTTP-only cookies
- File uploads use `multipart/form-data`
- Premium routes require active premium subscription
- Admin routes require admin role
- Rate limiting is applied to prevent abuse


