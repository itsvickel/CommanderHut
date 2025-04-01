import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import AIGenerate from "../AIGenerate";
import { fetchCardByQuery, fetchCardsFromAI } from "../../services/cardService";
import { RootState } from "../../store/store";

// Mock the services
jest.mock("../../services/cardService", () => ({
    fetchCardByQuery: jest.fn(),
    fetchCardsFromAI: jest.fn(),
}));

const middlewares = [thunk];
const mockStore = configureStore<RootState>(middlewares);

describe("AIGenerate Component", () => {
    let store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        store = mockStore({
            card: {
                card: null,
                loading: false,
                error: null,
            },
        });
    });

    test("renders input field and button", () => {
        render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        expect(screen.getByPlaceholderText("Enter your card query...")).toBeInTheDocument();
        expect(screen.getByRole("button")).toHaveTextContent("Generate Cards");
    });

    test("generates cards correctly when button is clicked", async () => {
        const mockCards = [
            { name: "Lightning Bolt", image_uris: { normal: "https://example.com/lightning-bolt.jpg" } },
            { name: "Giant Growth", image_uris: { normal: "https://example.com/giant-growth.jpg" } },
        ];

        // Mock the API responses
        (fetchCardsFromAI as jest.Mock).mockResolvedValue(["Lightning Bolt", "Giant Growth"]);
        (fetchCardByQuery as jest.Mock)
            .mockResolvedValueOnce(mockCards[0])
            .mockResolvedValueOnce(mockCards[1]);

        render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        fireEvent.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(fetchCardsFromAI).toHaveBeenCalledWith("Lightning Bolt");
            expect(fetchCardByQuery).toHaveBeenCalledWith("Lightning Bolt");
            expect(fetchCardByQuery).toHaveBeenCalledWith("Giant Growth");
        });

        await waitFor(() => {
            expect(screen.getByAltText("Lightning Bolt")).toHaveAttribute("src", "https://example.com/lightning-bolt.jpg");
            expect(screen.getByAltText("Giant Growth")).toHaveAttribute("src", "https://example.com/giant-growth.jpg");
        });
    });

    test("shows loading state while generating cards", () => {
        render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        fireEvent.click(screen.getByRole("button"));

        expect(screen.getByRole("button")).toHaveTextContent("Generating...");
        expect(screen.getByRole("button")).toBeDisabled();
    });

    test("shows error message if no cards are generated", async () => {
        (fetchCardsFromAI as jest.Mock).mockResolvedValue([]);

        render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Nonexistent Card" } });
        fireEvent.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.getByText("No cards were generated. Try a different query.")).toBeInTheDocument();
        });
    });

    test("shows error message if fetching cards fails", async () => {
        (fetchCardsFromAI as jest.Mock).mockRejectedValue(new Error("Failed to fetch cards"));

        render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        fireEvent.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.getByText("Failed to fetch cards. Please try again.")).toBeInTheDocument();
        });
    });
});
