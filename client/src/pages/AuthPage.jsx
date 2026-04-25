import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = isSignUp
        ? form
        : {
            username: form.username,
            password: form.password,
          };

      const data = isSignUp ? await register(payload) : await login(payload);
      const hasOrgs = data.user?.orgs?.length > 0;

      navigate(hasOrgs ? "/dashboard" : "/org/new");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isSignUp ? "create account" : "sign in"}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((currentMode) => !currentMode);
    setError("");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__header">
          <h1> Planora </h1>
          <h1>{isSignUp ? "Create your account" : "Hey !! Welcome Back"}</h1>
          <p>
            {isSignUp
              ? "Start organizing work with your team."
              : "Good to see you again."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="prawesh"
            autoComplete="username"
            required
          />

          {isSignUp && (
            <>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-card__toggle">
          {isSignUp ? "Already have an account?" : "New to Planora?"}{" "}
          <button type="button" onClick={toggleMode}>
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthPage;
