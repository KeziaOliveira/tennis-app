import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { loginUser, registerUser, resetPassword } from "../services/auth/firebaseAuth";
import "./Auth.css";

const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState("");
  
  useEffect(() => {
    setIsLogin(location.pathname === "/login");
    setIsRecovery(false);
    setSuccess("");
    setError("");
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
    setSuccess("");
    setLoading(true);

    try {
      if (isRecovery) {
        await resetPassword(email);
        setSuccess("Um link de recuperação de senha foi enviado para o seu e-mail!");
        setEmail("");
      } else if (isLogin) {
        await loginUser(email, password);
        navigate("/");
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
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || `Erro ao ${isRecovery ? "recuperar senha" : isLogin ? "fazer login" : "criar conta"}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setIsRecovery(false);
    setSuccess("");
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

        <h1 className="auth-title">
          {isRecovery ? "Recuperar Senha" : isLogin ? "Entrar" : "Criar Conta"}
        </h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {success && (
            <div style={{
              color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              {success}
            </div>
          )}

          {!isRecovery && !isLogin && (
            <div className="auth-input-group">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin && !isRecovery}
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

          {!isRecovery && (
            <div className="auth-input-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isRecovery}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          {!isRecovery && !isLogin && (
            <div className="auth-input-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin && !isRecovery}
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          {isLogin && !isRecovery && (
            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={() => { setIsRecovery(true); setError(""); setSuccess(""); }} 
                className="auth-link-button"
                style={{ fontSize: '13px', opacity: 0.8 }}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? isRecovery
                ? "Enviando..."
                : isLogin
                ? "Entrando..."
                : "Criando conta..."
              : isRecovery
              ? "Enviar Link"
              : isLogin
              ? "Entrar"
              : "Registrar"}
          </button>
        </form>

        <p className="auth-link-text">
          {isRecovery ? (
            <button 
              type="button" 
              onClick={() => { setIsRecovery(false); setError(""); setSuccess(""); }} 
              className="auth-link-button"
            >
              Voltar para o Login
            </button>
          ) : isLogin ? (
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
