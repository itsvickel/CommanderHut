import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import Card from "../Card/Card";
import { setCard, setError, setLoading } from "../../store/cardSlice";
import { fetchCardByQuery } from "../../services/cardService";
import { RootState } from "../../store/store";

// Mock the API call
jest.mock("../../services/cardService", () => ({
    fetchCardByQuery: jest.fn(),
}));

// Redux Mock Store configuration
const middlewares = [thunk];
const mockStore = configureStore<RootState>(middlewares);

describe("Card Component", () => {
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

    test("renders loading state correctly", () => {
        store = mockStore({
            card: { card: null, loading: true, error: null },
        });

        render(
            <Provider store={store}>
                <Card />
            </Provider>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("renders error state correctly", () => {
        store = mockStore({
            card: { card: null, loading: false, error: "Failed to fetch card" },
        });

        render(
            <Provider store={store}>
                <Card />
            </Provider>
        );

        expect(screen.getByText("Failed to fetch card")).toBeInTheDocument();
    });

    test("renders card data correctly", async () => {
        const mockCard = {
            name: "Lightning Bolt",
            image_uris: { normal: "https://example.com/lightning-bolt.jpg" },
            oracle_text: "Deal 3 damage to any target.",
        };

        // Mock the fetchCardByQuery response
        (fetchCardByQuery as jest.Mock).mockResolvedValue(mockCard);

        // Dispatch actions to update the store
        store.dispatch(setLoading());
        store.dispatch(setCard(mockCard));

        render(
            <Provider store={store}>
                <Card />
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByText("Lightning Bolt")).toBeInTheDocument();
            expect(screen.getByAltText("Lightning Bolt")).toHaveAttribute(
                "src",
                "https://example.com/lightning-bolt.jpg"
            );
            expect(screen.getByText("Deal 3 damage to any target.")).toBeInTheDocument();
        });
    });
});
