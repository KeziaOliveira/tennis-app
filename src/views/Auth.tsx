import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { loginUser, registerUser } from "../services/auth/firebaseAuth";
import "./Auth.css";

const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  
  useEffect(() => {
    setIsLogin(location.pathname === "/login");
  }, [location.pathname]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          setLoading(false);
          return;
        }
        await registerUser(email, password, name);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || `Erro ao ${isLogin ? "fazer login" : "criar conta"}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    navigate(newMode ? "/login" : "/register", { replace: true });
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1 className="auth-title">{isLogin ? "Entrar" : "Criar Conta"}</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-input-group">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Seu nome"
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="auth-input-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? isLogin
                ? "Entrando..."
                : "Criando conta..."
              : isLogin
              ? "Entrar"
              : "Registrar"}
          </button>
        </form>

        <p className="auth-link-text">
          {isLogin ? (
            <>
              Não tem uma conta?{" "}
              <button type="button" onClick={toggleMode} className="auth-link-button">
                Registre-se
              </button>
            </>
          ) : (
            <>
              Já tem uma conta?{" "}
              <button type="button" onClick={toggleMode} className="auth-link-button">
                Faça login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;

