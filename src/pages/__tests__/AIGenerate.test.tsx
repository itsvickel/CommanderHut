import rtl from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import AIGenerate from "../AIGenerate";
import { fetchCardByName, fetchCardsFromAI } from "../../services/cardService";
import { RootState } from "../../store";

// Mock the services
jest.mock("../../services/cardService", () => ({
    fetchCardByName: jest.fn(),
    fetchCardsFromAI: jest.fn(),
}));

const middlewares = [thunk as any];
const mockStore = configureStore<RootState, any>(middlewares);

describe("AIGenerate Component", () => {
    let store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        store = mockStore({
            auth: { isAuthenticated: false, user: null },
            card: {
                card: null,
                loading: false,
                error: null,
            },
        } as any);
    });

    test("renders input field and button", () => {
        rtl.render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        expect(rtl.screen.getByPlaceholderText("Enter your card query...")).toBeInTheDocument();
        expect(rtl.screen.getByRole("button")).toHaveTextContent("Generate Cards");
    });

    test("generates cards correctly when button is clicked", async () => {
        const mockCards = [
            { name: "Lightning Bolt", image_uris: { normal: "https://example.com/lightning-bolt.jpg" } },
            { name: "Giant Growth", image_uris: { normal: "https://example.com/giant-growth.jpg" } },
        ];

        (fetchCardsFromAI as jest.Mock).mockResolvedValue(["Lightning Bolt", "Giant Growth"]);
        (fetchCardByName as jest.Mock)
            .mockResolvedValueOnce([mockCards[0]])
            .mockResolvedValueOnce([mockCards[1]]);

        rtl.render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        rtl.fireEvent.change(rtl.screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        rtl.fireEvent.click(rtl.screen.getByRole("button"));

        await rtl.waitFor(() => {
            expect(fetchCardsFromAI).toHaveBeenCalledWith("Lightning Bolt");
            expect(fetchCardByName).toHaveBeenCalledWith("Lightning Bolt");
            expect(fetchCardByName).toHaveBeenCalledWith("Giant Growth");
        });

        await rtl.waitFor(() => {
            expect(rtl.screen.getByAltText("Lightning Bolt")).toHaveAttribute("src", "https://example.com/lightning-bolt.jpg");
            expect(rtl.screen.getByAltText("Giant Growth")).toHaveAttribute("src", "https://example.com/giant-growth.jpg");
        });
    });

    test("shows loading state while generating cards", async () => {
        (fetchCardsFromAI as jest.Mock).mockResolvedValue([]);

        rtl.render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        rtl.fireEvent.change(rtl.screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        rtl.fireEvent.click(rtl.screen.getByRole("button"));

        expect(rtl.screen.getByRole("button")).toHaveTextContent("Generating...");
        expect(rtl.screen.getByRole("button")).toBeDisabled();
    });

    test("shows error message if no cards are generated", async () => {
        (fetchCardsFromAI as jest.Mock).mockResolvedValue([]);

        rtl.render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        rtl.fireEvent.change(rtl.screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Nonexistent Card" } });
        rtl.fireEvent.click(rtl.screen.getByRole("button"));

        await rtl.waitFor(() => {
            expect(rtl.screen.getByText("No cards were generated. Try a different query.")).toBeInTheDocument();
        });
    });

    test("shows error message if fetching cards fails", async () => {
        (fetchCardsFromAI as jest.Mock).mockRejectedValue(new Error("Failed to fetch cards"));

        rtl.render(
            <Provider store={store}>
                <AIGenerate />
            </Provider>
        );

        rtl.fireEvent.change(rtl.screen.getByPlaceholderText("Enter your card query..."), { target: { value: "Lightning Bolt" } });
        rtl.fireEvent.click(rtl.screen.getByRole("button"));

        await rtl.waitFor(() => {
            expect(rtl.screen.getByText("Failed to fetch cards. Please try again.")).toBeInTheDocument();
        });
    });
});
