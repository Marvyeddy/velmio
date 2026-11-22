import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/home-page";
import { SigninPage } from "./pages/signin-page";
import Signup from "./pages/signup-page";
import { ChatPage } from "./pages/chat-page";
import ForgotPassword from "./pages/forgot-password-page";
import ResetPassword from "./pages/reset-password-page";
import Profile from "./pages/profile-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProtectedRoute } from "./components/auth/protected-route";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />

          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
