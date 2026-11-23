import { SignupPage } from "@/pages/signup-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { expect, vi } from "vitest";
import { describe, it } from "vitest";
import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

const apiUrl = import.meta.env.VITE_API_URL;

function renderSignupPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SignupPage", () => {
  it("rejects invalid form data", async () => {
    const user = userEvent.setup();
    const signupRequest = vi.fn();

    server.use(
      http.post(`${apiUrl}/api/v1/auth/signup`, () => {
        signupRequest();
        return HttpResponse.json({ message: "Created" });
      }),
    );

    renderSignupPage();

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Username must contain at least 3 characters"),
    ).toBeInTheDocument();

    expect(signupRequest).not.toHaveBeenCalled();
  });

  it("rejects mis-matched password", async () => {
    const user = userEvent.setup();

    renderSignupPage();

    await user.type(screen.getByLabelText("Username"), "testUser");
    await user.type(
      screen.getByLabelText("Email address"),
      "testuser@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "password123",
    );
    await user.type(screen.getByLabelText("Confirm password"), "difference123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/password do not match/i),
    ).toBeInTheDocument();
  });

  it("registers a user and shows email verification instructions", async () => {
    const user = userEvent.setup();
    const signupRequest = vi.fn();

    server.use(
      http.post(`${apiUrl}/api/v1/auth/signup`, async ({ request }) => {
        signupRequest(await request.json());

        return HttpResponse.json(
          { message: "Account created" },
          { status: 201 },
        );
      }),
    );

    renderSignupPage();

    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "password123",
    );
    await user.type(screen.getByLabelText("Confirm password"), "password123");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();

    expect(signupRequest).toHaveBeenCalledWith({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
  });
});
