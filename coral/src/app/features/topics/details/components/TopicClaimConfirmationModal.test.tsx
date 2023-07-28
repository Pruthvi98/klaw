import { TopicClaimConfirmationModal } from "src/app/features/topics/details/components/TopicClaimConfirmationModal";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();
describe("TopicClaimConfirmationModal", () => {
  const user = userEvent.setup();

  describe("renders all necessary elements when isLoading is false", () => {
    beforeEach(() => {
      render(
        <TopicClaimConfirmationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );
    });

    afterEach(() => {
      cleanup();
      jest.clearAllMocks();
    });

    it("shows a dialog element", () => {
      const dialog = screen.getByRole("dialog");

      expect(dialog).toBeVisible();
    });

    it("shows more information to claim the topic", () => {
      const dialog = screen.getByRole("dialog");
      const headline = within(dialog).getByRole("heading", {
        name: "Claim topic",
      });
      const text = within(dialog).getByText(
        "Are you sure you would like to claim this topic?"
      );

      expect(headline).toBeVisible();
      expect(text).toBeVisible();
    });

    it("shows a textarea where user can add a comment why they claim the topic", () => {
      const dialog = screen.getByRole("dialog");
      const textarea = within(dialog).getByRole("textbox", {
        name: "You can add the reason to claim the topic (optional)",
      });

      expect(textarea).toBeEnabled();
    });

    it("shows a button to cancel process", () => {
      const dialog = screen.getByRole("dialog");
      const cancelButton = within(dialog).getByRole("button", {
        name: "Cancel",
      });

      expect(cancelButton).toBeEnabled();
    });

    it("shows a button to claim topic", () => {
      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: "Request claim topic",
      });

      expect(confirmButton).toBeEnabled();
    });
  });

  describe("shows disabled buttons when isLoading is true", () => {
    beforeAll(() => {
      render(
        <TopicClaimConfirmationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );
    });

    afterAll(() => {
      cleanup();
      jest.clearAllMocks();
    });

    it("disables textarea where user can add a comment why they claim the topic", () => {
      const dialog = screen.getByRole("dialog");
      const textarea = within(dialog).getByRole("textbox", {
        name: "You can add the reason to claim the topic (optional)",
      });

      expect(textarea).toBeDisabled();
    });

    it("disables button to cancel process", () => {
      const dialog = screen.getByRole("dialog");
      const cancelButton = within(dialog).getByRole("button", {
        name: "Cancel",
      });

      expect(cancelButton).toBeDisabled();
    });

    it("disables button to claim topic and shows loading indicator", () => {
      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getByRole("button", {
        name: "Request claim topic",
      });
      const loadingAnimation =
        within(confirmButton).getByTestId("loading-button");

      expect(confirmButton).toBeDisabled();
      expect(loadingAnimation).toBeVisible();
    });
  });

  describe("enables user to cancel process", () => {
    beforeEach(() => {
      render(
        <TopicClaimConfirmationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );
    });

    afterEach(() => {
      cleanup();
      jest.clearAllMocks();
    });

    it("triggers a given onClose function if user clicks cancel", async () => {
      const dialog = screen.getByRole("dialog");
      const cancelButton = within(dialog).getByRole("button", {
        name: "Cancel",
      });

      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("enables user to start the claiming process", () => {
    beforeEach(() => {
      render(
        <TopicClaimConfirmationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );
    });

    afterEach(() => {
      cleanup();
      jest.clearAllMocks();
    });

    it("triggers a given submit function with correct date when user adds a reason", async () => {
      const dialog = screen.getByRole("dialog");
      const textarea = within(dialog).getByRole("textbox", {
        name: "You can add the reason to claim the topic (optional)",
      });

      const confirmationButton = within(dialog).getByRole("button", {
        name: "Request claim topic",
      });

      await user.type(textarea, "This is my reason");
      await user.click(confirmationButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("This is my reason");
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});