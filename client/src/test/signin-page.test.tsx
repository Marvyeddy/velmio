import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { SigninPage } from "@/pages/signin-page";
import { server } from "@/test/mocks/server";

const apiUrl = import.meta.env.VITE_API_URL;

function renderSigninPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/signin"]}>
        <Routes>
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/chat" element={<h1>Chat page</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SigninPage", () => {
  it("signs in and redirects to chat", async () => {
    const user = userEvent.setup();
    const signinRequest = vi.fn();

    server.use(
      http.get(`${apiUrl}/api/v1/users/me`, () => {
        return new HttpResponse(null, { status: 401 });
      }),

      http.post(`${apiUrl}/api/v1/auth/signin`, async ({ request }) => {
        signinRequest(await request.json());

        return HttpResponse.json({ message: "Signed in" });
      }),
    );

    renderSigninPage();

    await user.type(
      await screen.findByLabelText("Email address"),
      "test@example.com",
    );

    await user.type(screen.getByLabelText("Password"), "password123");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Chat page" }),
    ).toBeInTheDocument();

    expect(signinRequest).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows an error for invalid credentials", async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${apiUrl}/api/v1/users/me`, () => {
        return new HttpResponse(null, { status: 401 });
      }),

      http.post(`${apiUrl}/api/v1/auth/signin`, () => {
        return HttpResponse.json(
          { detail: "Invalid credentials" },
          { status: 401 },
        );
      }),
    );

    renderSigninPage();

    await user.type(
      await screen.findByLabelText("Email address"),
      "test@example.com",
    );

    await user.type(screen.getByLabelText("Password"), "wrongpassword");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
  });

  it("validates the form before sending a request", async () => {
    const user = userEvent.setup();
    const signinRequest = vi.fn();

    server.use(
      http.get(`${apiUrl}/api/v1/users/me`, () => {
        return new HttpResponse(null, { status: 401 });
      }),

      http.post(`${apiUrl}/api/v1/auth/signin`, () => {
        signinRequest();
        return HttpResponse.json({ message: "Signed in" });
      }),
    );

    renderSigninPage();

    await screen.findByRole("button", { name: "Sign in" });

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();

    expect(screen.getByText("Password is required")).toBeInTheDocument();

    expect(signinRequest).not.toHaveBeenCalled();
  });
});
