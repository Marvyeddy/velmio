import { describe, expect, it } from "vitest";
import { ChatSidebar } from "./chat-sidebar";
import { render, screen } from "@testing-library/react";

describe("ChatSidebar", () => {
  it("renders the velmio branding", () => {
    render(<ChatSidebar />);

    expect(screen.getByRole("link", { name: "Velmio" })).toBeInTheDocument;
  });

  it("renders the new chat link", () => {
    render(<ChatSidebar />);

    const newChatLink = screen.getByRole("link", { name: "New chat" });

    expect(newChatLink).toHaveAttribute("href", "/chat");
  });
});
