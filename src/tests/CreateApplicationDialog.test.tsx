import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateApplicationDialog } from "@/features/jobs/components/CreateApplicationDialog";

vi.mock("@/features/jobs/actions", () => ({
  createApplicationAction: vi.fn(async () => ({ success: true, data: { id: "app_1" } })),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CreateApplicationDialog", () => {
  it("opens the dialog and shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    renderWithClient(<CreateApplicationDialog />);

    await user.click(screen.getByRole("button", { name: /add application/i }));
    expect(await screen.findByText(/add a job application/i)).toBeInTheDocument();

    // Submit with empty required fields.
    await user.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/job title is required/i)).toBeInTheDocument();
    });
  });

  it("submits successfully once required fields are filled in", async () => {
    const user = userEvent.setup();
    renderWithClient(<CreateApplicationDialog />);

    await user.click(screen.getByRole("button", { name: /add application/i }));
    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: "Acme Inc." } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: "Senior Engineer" } });

    await user.click(screen.getByRole("button", { name: /add to wishlist/i }));

    await waitFor(() => {
      expect(screen.queryByText(/add a job application/i)).not.toBeInTheDocument();
    });
  });
});
