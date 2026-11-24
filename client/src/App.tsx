import { BrowserRouter, Routes, Route } from "react-router";

import { HomePage } from "./pages/home-page";
import { SigninPage } from "./pages/signin-page";
import { SignupPage } from "./pages/signup-page";
import { ChatPage } from "./pages/chat-page";
import { ForgotPasswordPage } from "./pages/forgot-password-page";
import { ResetPasswordPage } from "./pages/reset-password-page";
import { NotFoundPage } from "./pages/not-found-page";
import { VerifyEmailRequiredPage } from "./pages/verify-email-required-page";
import { VerifyEmailPage } from "./pages/verify-email-page";

import { ProtectedRoute } from "./components/auth/protected-route";
import { ResetPasswordGuard } from "./guard/reset-password-guard";
import { VerifyEmailGuard } from "./guard/verify-email-guard";
import { ProfilePage } from "./pages/profile-page";
import { DocumentsPage } from "./pages/documents-page";
import { DashboardLayout } from "./layouts/dashboard-layout";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ResetPasswordGuard />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<VerifyEmailGuard />}>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route
          path="/verify-email-required"
          element={<VerifyEmailRequiredPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/chat" element={<ChatPage />} />

            <Route path="/chat/:conversationId" element={<ChatPage />} />

            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/documents" element={<DocumentsPage />} />
          </Route>
        </Route>

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
