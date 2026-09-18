import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Silence expected console noise from error-boundary tests, etc.
vi.spyOn(console, "error").mockImplementation(() => {});
