import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.png';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen z-10">
      {/* Hero Section */}
      <div className="relative h-[650px] flex items-center justify-center">
        <div className="glass-card p-12 max-w-4xl mx-4 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="FlavourHub Logo"
              className="h-28 w-28 object-contain rounded-2xl shadow-xl ring-4 ring-orange-500/20 animate-pulse-slow"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-premium mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">FlavourHub</span>
          </h1>
          <p className="text-xl text-premium-subtle mb-2 font-medium">Your Recipe Community Platform</p>
          <p className="text-lg text-premium-subtle mb-8">
            Discover thousands of recipes from around the world. Share your own creations,
            connect with food lovers, and save your favourites — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover" className="btn-premium-secondary">
              🍽️ Discover Recipes
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-premium">
                Join the Community
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/recipes/create" className="btn-premium">
                ✏️ Create a Recipe
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-4 text-premium">What You Can Do</h2>
        <p className="text-center text-premium-subtle mb-12 text-lg">Everything you need to explore, create, and share amazing food.</p>
        <div className="grid md:grid-cols-3 gap-8">

          <div className="glass-card-hover p-6 stagger-item">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Discover Recipes</h3>
            <p className="text-premium-subtle">
              Browse thousands of recipes from TheMealDB and our community. Filter by category,
              cuisine, or search by name to find exactly what you are craving.
            </p>
          </div>

          <div className="glass-card-hover p-6 stagger-item" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Create & Share</h3>
            <p className="text-premium-subtle">
              Write and publish your own recipes with ingredients, step-by-step instructions,
              and a photo. Share your culinary creations with the whole community.
            </p>
          </div>

          <div className="glass-card-hover p-6 stagger-item" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Like & Save</h3>
            <p className="text-premium-subtle">
              Like your favourite recipes and save them to your personal collection so you
              can always find them later — even recipes from TheMealDB.
            </p>
          </div>

          <div className="glass-card-hover p-6 stagger-item" style={{ animationDelay: '0.3s' }}>
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Comment & Connect</h3>
            <p className="text-premium-subtle">
              Leave comments on community recipes, share your tips and tweaks,
              and connect with other passionate home cooks and chefs.
            </p>
          </div>

          <div className="glass-card-hover p-6 stagger-item" style={{ animationDelay: '0.4s' }}>
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Export Recipes</h3>
            <p className="text-premium-subtle">
              Download any recipe as a beautifully formatted PDF to print and use in the
              kitchen, or export your shopping list as a CSV file for easy grocery runs.
            </p>
          </div>

          <div className="glass-card-hover p-6 stagger-item" style={{ animationDelay: '0.5s' }}>
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-semibold mb-3 text-premium">Your Profile</h3>
            <p className="text-premium-subtle">
              Manage all your created and saved recipes in one personal dashboard.
              Edit or delete your recipes anytime and keep your collection organised.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
