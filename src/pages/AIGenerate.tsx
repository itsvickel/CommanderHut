import { useState } from "react";
import { fetchCardByQuery, fetchCardsFromAI } from "../services/cardService";

import styled from 'styled-components';

const AIGenerate = () => {
    const [query, setQuery] = useState("");
    const [cards, setCards] = useState<object[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerateCards = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError("");
        setCards([]);

        try {
            const generatedCards = await fetchCardsFromAI(query).then((res) => { console.log(res) });
            if (generatedCards.length === 0) {
                setError("No cards were generated. Try a different query.");
            }

            generatedCards.map((item) => {
                fetchCardByQuery(item).then((res) => {
                    // return res;
                    setCards(cards => [...cards, res]);
                });
            });

        } catch (err) {
            setError("Failed to fetch cards. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI-Generated MTG Cards</h2>

            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your card query..."
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />

            <button
                onClick={handleGenerateCards}
                disabled={loading}
                className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
            >
                {loading ? "Generating..." : "Generate Cards"}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            {cards.length > 0 && (
                <Column className="mt-4 border-t border-gray-200 pt-4">
                    {cards.map((item, index) => {
                        return <div key={index}>
                            <img src={item?.image_uris?.normal} alt={item?.name} />
                        </div>
                    })}
                </Column>
            )}
        </div>
    );
};

export default AIGenerate;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scrol;;
`;