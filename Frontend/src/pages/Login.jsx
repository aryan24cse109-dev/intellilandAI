import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import Input from "../components/common/Input";

import useAuth from "../hooks/useAuth";
import {
  getApiErrorMessage,
  isValidEmail,
} from "../utils/helpers";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setServerError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await login(
        formData.email.trim(),
        formData.password
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login failed:", error);

      setServerError(
        getApiErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">

        {/* Brand */}
        <div className="login-brand">
          <img
            src="/logo/intelliland-logo.png"
            alt="IntelliLandAI"
            className="login-brand-logo"
          />

          <p className="login-brand-description">
            Intelligent Land Record Digitization
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">

          <div className="login-heading">
            <h2>Sign in</h2>

            <p>
              Access the IntelliLandAI land records
              management platform.
            </p>
          </div>

          {serverError && (
            <div
              className="login-error"
              role="alert"
            >
              <strong>Login failed</strong>

              <span>
                {serverError}
              </span>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="login-button"
            >
              Sign In
            </Button>
          </form>

          <div className="login-footer">
            <span>
              Secure government land-record workflow
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="login-disclaimer">
          IntelliLandAI • AI-powered digitization,
          validation and parcel linking
        </p>
      </section>
    </main>
  );
}

export default Login;