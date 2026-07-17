# Browser Test Links

Copy and paste these links directly into your browser address bar to test the API.

**Base URL:** `http://localhost:5000` (change if your server runs on a different port)

---

## 🔍 Health Check

```
http://localhost:5000/health
```

---

## 🤖 AI Routes (No Auth Required)

### Check Ollama Status
```
http://localhost:5000/api/ai/status
```

---

## 📚 Recipe Routes (No Auth Required)

### Get All Recipes
```
http://localhost:5000/api/recipes
```

### Get Recipes with Filters
```
http://localhost:5000/api/recipes?page=1&limit=10
http://localhost:5000/api/recipes?category=dinner
http://localhost:5000/api/recipes?search=pasta
http://localhost:5000/api/recipes?sort=popular
```

### Get Recipe by ID
(Replace `RECIPE_ID` with an actual recipe ID from your database)
```
http://localhost:5000/api/recipes/RECIPE_ID
```

---

## 🌐 TheMealDB Proxy Routes (No Auth Required)

### Get All Categories
```
http://localhost:5000/api/external/mealdb/categories
```

### Get Meal by ID
```
http://localhost:5000/api/external/mealdb/meals/52772
```

### Search Meals
```
http://localhost:5000/api/external/mealdb/search?s=pasta
http://localhost:5000/api/external/mealdb/search?s=chicken
http://localhost:5000/api/external/mealdb/search?s=cake
```

---

## 🔐 Authentication Routes

### Verify Email
(Replace `TOKEN` with actual verification token)
```
http://localhost:5000/api/auth/verify-email?token=TOKEN
```

**Note:** For POST routes (register, login, logout), you'll need to use:
- Browser DevTools Console (JavaScript fetch)
- Postman/Insomnia
- curl commands
- The test script (`node test-api.js`)

---

## 📋 Quick Test Checklist

✅ **Start Here:**
1. Health Check: `http://localhost:5000/health`
2. Ollama Status: `http://localhost:5000/api/ai/status`
3. Get Recipes: `http://localhost:5000/api/recipes`
4. Get Categories: `http://localhost:5000/api/external/mealdb/categories`

---

## 🛠️ Testing POST/PUT/DELETE Routes in Browser

For routes that require POST, PUT, or DELETE, use the browser console:

### Open Browser Console (F12) and run:

#### Register User
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)
```

#### Login
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)
```

#### Get Current User (After Login)
```javascript
fetch('http://localhost:5000/api/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

#### AI Chat
```javascript
fetch('http://localhost:5000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello! How do I make pasta?',
    conversationHistory: []
  })
}).then(r => r.json()).then(console.log)
```

#### Like Recipe
```javascript
fetch('http://localhost:5000/api/recipes/RECIPE_ID/like', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## 📝 Notes

- **GET requests** can be tested directly in browser
- **POST/PUT/DELETE requests** need browser console or API tools
- Make sure your server is running on `http://localhost:5000`
- For authenticated routes, login first to get cookies
- Replace `RECIPE_ID` with actual IDs from your database

---

## 🔗 Quick Copy Links (Click to test if server is running)

### Essential Tests:
- [Health Check](http://localhost:5000/health)
- [Ollama Status](http://localhost:5000/api/ai/status)
- [Get Recipes](http://localhost:5000/api/recipes)
- [Get Categories](http://localhost:5000/api/external/mealdb/categories)
- [Search Meals](http://localhost:5000/api/external/mealdb/search?s=pasta)


