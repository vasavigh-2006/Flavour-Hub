# 🍽️ FlavourHub

> **Discover, Create & Share Recipes with the World**

FlavourHub is a full-stack recipe platform where users can explore thousands of recipes from around the globe, create and share their own community recipes, save favourites, and download beautifully formatted recipe PDFs — all in one place.

---

##  Features

- 🔐 **User Authentication** — Secure JWT-based login & registration with email verification
- 🌍 **Recipe Discovery** — Browse 1000+ recipes from TheMealDB API with search & category filters
- 📝 **Community Recipes** — Create, edit, and share your own recipes with image uploads
- ❤️ **Save & Like** — Bookmark favourite recipes and like community posts
- 💬 **Comments** — Engage with the community through recipe comments
- 📄 **PDF Export** — Download any recipe as a beautifully branded PDF with images
- 👑 **Admin Dashboard** — Manage users, reports, and community content
- 🌙 **Dark / Light Mode** — Smooth theme toggle with warm, vibrant colours
- 📱 **Fully Responsive** — Works seamlessly on desktop, tablet, and mobile

---

##  Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| Vite | Build Tool |
| React Router v6 | Client-side Routing |
| Axios | HTTP Client with JWT Interceptors |
| CSS3 | Custom Animations & Glassmorphism |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API Server |
| MongoDB + Mongoose | Database & ODM |
| JWT | Access & Refresh Token Auth |
| Multer | Image Upload Handling |
| PDFKit | PDF Generation |
| Node-Cache | API Response Caching |
| Nodemailer | Email Verification |

---

## 📁 Project Structure

```
flavourhub/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Home, Discover, Login, Register, Profile...
│   │   ├── components/     # Layout, FoodBackground, Route Guards
│   │   ├── contexts/       # Auth Context (global state)
│   │   └── utils/          # Axios API instance
│   └── index.html
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── controllers/    # Business logic
│       ├── routes/         # API endpoints
│       ├── models/         # MongoDB schemas
│       ├── middleware/     # Auth, rate limiter, uploads
│       └── utils/          # PDF, JWT, email, cache helpers
├── docs/                   # API documentation & guides
├── docker-compose.yml      # Docker setup
└── package.json            # Root workspace
```

---

##  Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/vasavigh-2006/Flavour-Hub.git
cd Flavour-Hub
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server/` folder:
```env
MONGODB_URI=mongodb://localhost:27017/flavourhub
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

Create a `.env` file inside the `client/` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the App
```bash
# Run both frontend and backend together
npm run dev
```

Frontend runs at: `http://localhost:5173`  
Backend runs at: `http://localhost:5000`

---

## 🌐 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get tokens |
| GET | `/api/mealdb/search` | Search MealDB recipes |
| GET | `/api/recipes` | Get community recipes |
| POST | `/api/recipes` | Create a new recipe |
| GET | `/api/export/pdf/:id` | Download recipe as PDF |

> See the full API reference in the [`/docs`](./docs) folder.

---

## 🔒 Security

- JWT Access Tokens (short-lived, 15 minutes)
- JWT Refresh Tokens (secure HTTP-only cookies, 7 days)
- Rate limiting (500 requests / 15 minutes per IP)
- Input validation on all routes
- Secure file upload with type & size restrictions

---

## 📄 License

This project was built as a 3rd semester web development project.

---

<div align="center">
  <strong>Built with ❤️ by Vasavi</strong><br/>
  <em>FlavourHub — Where Every Recipe Tells a Story</em>
</div>
