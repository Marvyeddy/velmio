import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/home-page";
import { SigninPage } from "./pages/signin-page";
import { ChatPage } from "./pages/chat-page";
import { ForgotPasswordPage } from "./pages/forgot-password-page";
import { ResetPasswordPage } from "./pages/reset-password-page";
import Profile from "./pages/profile-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProtectedRoute } from "./components/auth/protected-route";
import { SignupPage } from "./pages/signup-page";
import { VerifyEmailRequiredPage } from "./pages/verify-email-required-page";
import { VerifyEmailPage } from "./pages/verify-email-page";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/verify-email-required"
          element={<VerifyEmailRequiredPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />

          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
