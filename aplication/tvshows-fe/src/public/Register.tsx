import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, Lock, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const API_URL = "http://localhost:30120";

function Register() {
  const { isAuthenticated } = useAuth();
  const loc = useLocation() as any;

  if (isAuthenticated) {
    return <Navigate to="/tv-shows" replace state={{ from: loc }} />;
  }
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Verifica se os campos coincidem.",
        action: {
          label: "Close",
          onClick: () => {},
        },
      });

      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      return;
    }

    if (!consentRgpd) {
      toast.error("É necessário aceitar o RGPD.", {
        description: "Marca a opção de consentimento para continuar.",
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || null,
          consentRgpd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Conta criada com sucesso!", {
          description: "Agora já podes iniciar sessão.",
        });
        setEmail("");
        setDisplayName("");
        setPassword("");
        setConfirmPassword("");
        setConsentRgpd(false);
        <Navigate to="/login" />;
      } else if (res.status === 409) {
        toast.error("Email já registado.", {
          description: "Tenta iniciar sessão ou usa outro email.",
          action: {
            label: "Close",
            onClick: () => {},
          },
        });
      } else if (res.status === 400) {
        toast.error("Dados inválidos.", {
          description: data?.error ?? "Revê os campos e tenta novamente.",
          action: {
            label: "Close",
            onClick: () => {},
          },
        });
      } else {
        toast.error("Erro ao criar conta", {
          description:
            data?.detail || data?.error || "Tenta novamente mais tarde.",
          action: {
            label: "Close",
            onClick: () => {},
          },
        });
      }
    } catch (err: any) {
      toast.error("Falha de comunicação", {
        description: err?.message ?? "Verifica a API e a tua ligação.",
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-100/50 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Users className="text-white" size={32} />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-lg">
            Join us to explore TV shows and actors
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Display Name (opcional)
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
              placeholder="How do you want to appear as"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500"
                size={18}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-500"
                size={18}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-rose-500"
                size={18}
              />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {/* RGPD */}
          <div className="flex items-start gap-3">
            <input
              id="rgpd"
              type="checkbox"
              checked={consentRgpd}
              onChange={(e) => setConsentRgpd(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-purple-500"
              required
            />
            <label htmlFor="rgpd" className="text-sm text-gray-700">
              Declaro que li e aceito o processamento de dados pessoais (RGPD)
              para criação e manutenção da conta.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <UserPlus size={20} />
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 hover:opacity-50 transition-opacity duration-300 -z-10"></div>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-lg">
            Already have an account?{" "}
            <Link
              to="/login"
              className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 font-semibold transition-all duration-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;