import { Link } from "react-router-dom";
import { Tv, Users, Star, TrendingUp, Play, Award } from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Hero Section */}
        <div className="pt-20 pb-16 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Play className="text-white ml-1" size={32} />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Amazing
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-pulse">
              {" "}
              TV Shows
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Explore your favorite TV shows, discover talented actors, and dive
            deep into the world of entertainment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tv-shows"
              className="group  inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 font-medium rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              <Tv
                size={20}
                className="mr-2 group-hover:animate-pulse text-white"
              />
              <span className="text-white">Explore TV Shows</span>
            </Link>

            <Link
              to="/actors"
              className="group inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-2xl border border-gray-200/50 hover:bg-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Users size={20} className="mr-2 group-hover:animate-pulse" />
              Meet Actors
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 text-xl">
              A complete platform for TV show and actor discovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <Tv className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                TV Show Library
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Browse through a curated collection of popular TV shows with
                detailed information and ratings.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <Users className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Actor Profiles
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Discover talented actors, read their biographies, and explore
                their filmography.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <TrendingUp className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Smart Navigation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Seamlessly navigate between shows and actors to discover
                connections and new content.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100/50 relative z-10 overflow-hidden">
          <div className="absolute bg-gradient-to-r from-purple-50/50 to-blue-50/50"></div>

          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Award className="text-yellow-500" size={32} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Join Our Services
            </h2>
            <p className="text-gray-600 text-xl">
              Discover why users love our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
            <div className="group">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                100+
              </div>
              <div className="text-gray-600 text-lg font-medium">TV Shows</div>
            </div>

            <div className="group">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                50+
              </div>
              <div className="text-gray-600 text-lg font-medium">
                Talented Actors
              </div>
            </div>

            <div className="group">
              <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                4.8
              </div>
              <div className="text-gray-600 text-lg font-medium flex items-center justify-center">
                <Star
                  className="text-yellow-400 mr-2 animate-pulse"
                  size={20}
                  fill="currentColor"
                />
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
