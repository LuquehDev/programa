import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div className="flex justify-between items-center min-w-screen py-2 sm:py-6 px-6 sm:px-20 border-b-1 border-neutral-200 shadow-lg">
      <div className="flex gap-2 items-center">
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 hover:animate-pulse"
        >
          ShowTime
        </Link>
        {isAuthenticated && (
          <>
            <Link
              to="/tv-shows"
              className="px-4 py-2 cursor-pointer rounded-full transition-colors duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 group"
            >
              <span className="font-semibold text-black group-hover:text-white transition-colors duration-300">
                Tv Shows
              </span>
            </Link>
            <Link
              to="/actors"
              className="px-4 py-2 cursor-pointer rounded-full transition-colors duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 group"
            >
              <span className="font-semibold text-black group-hover:text-white transition-colors duration-300">
                Actors
              </span>
            </Link>
            <Link
              to="/favorites"
              className="px-4 py-2 cursor-pointer rounded-full transition-colors duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 group"
            >
              <span className="font-semibold text-black group-hover:text-white transition-colors duration-300">
                Favorites
              </span>
            </Link>
          </>
        )}
      </div>

      <div className="flex gap-2 ">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="font-normal text-black opacity-70">
              Welcome back,{" "}
              <span className="font-medium">
                {user?.displayName || user?.email || "user"}
              </span>
              !
            </span>
            <Link to="/">
              <LogOut
                width={20}
                className="opacity-60 text-red-600 cursor-pointer active:scale-85"
                onClick={logout}
              />
            </Link>
          </div>
        ) : (
          <>
            <Link to="/login">
              <div className="hover:bg-purple-500 hover:text-white px-4 py-1 rounded-full hover:scale-105 text-black transition-all duration-300 cursor-pointer font-semibold">
                <span>Login</span>
              </div>
            </Link>
            <Link to="/register">
              <div className="bg-purple-600 hover:bg-purple-500 px-4 py-1 rounded-full hover:scale-105 text-white transition-all duration-300 cursor-pointer font-semibold">
                <span>Register</span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;
