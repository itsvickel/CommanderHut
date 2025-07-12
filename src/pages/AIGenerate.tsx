import { useState } from "react";
import { fetchCardByQuery, fetchCardsFromAI } from "../services/cardService";

import styled from 'styled-components';
import { Button, Input } from "../components/UI_Components/index";

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

            <Input 
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your card query..."
                value={query}
            />

            <Button 
                name= {loading ? "Generating..." : "Generate Cards"} 
                onClick={handleGenerateCards}
            />

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