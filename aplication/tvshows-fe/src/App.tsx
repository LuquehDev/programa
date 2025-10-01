import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import Header from "./public/components/Header";
import Home from "./public/Home";
import TvShows from "./auth/TvShows";
import Actors from "./auth/Actors";
import Register from "./public/Register";
import Login from "./public/Login";
import TVShowDetails from "./auth/TvShowDetails";
import ActorDetails from "./auth/ActorsDetails";
import Favorites from "./auth/Favorites";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen min-w-screen bg-gray-50">
          <Header />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tv-shows" element={<TvShows />} />
            <Route path="/tv-shows/:id" element={<TVShowDetails />} />
            <Route path="/actors/:id" element={<ActorDetails />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/actors" element={<Actors />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
