"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {RESET_PASSWORD } from "@/utils/api"; // Added SEND_RESET_PASSWORD_EMAIL
import Api from "@/api/AxiosInterceptors";
import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent";
import { t } from "@/utils";
import './reset-password.css';

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!password || !passwordConfirmation) {
      setErrorMessage("Please fill all fields");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await Api.post(RESET_PASSWORD, {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (!res.data.error) {
        setSuccessMessage("Password reset successfully. You may now log in.");
      } else {
        setErrorMessage(res.data.message || "Something went wrong");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again."+err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reset-password">
      <BreadcrumbComponent title2={t("resetPassword")} />
      <div className="container">
        <div className="page_content">
          <form onSubmit={handleSubmit} className="reset-password-form">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
