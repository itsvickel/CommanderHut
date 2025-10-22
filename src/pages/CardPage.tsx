import React, { useEffect, useState } from 'react';
import { fetchCardByName, fetchListOfRandomCards } from '../services/cardService';

import styled from 'styled-components';
import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import CardItem from '../Components/Card/CardItem';

interface Card {
    name: string;
    image_uris: { normal: string };
    oracle_text: string;
}

const CardPage = () => {
    const [listOfcards, setListOfCards] = useState<Card[]>([]);
    const [cardInput, setCardInput] = useState<string>("");
    const [searchedCards, setSearchedCards] = useState<Card[]>([]);

    useEffect(() => {
        const getRandomList = async () => {
            try {
                const randomListOfcards = await fetchListOfRandomCards(20);
                setListOfCards(randomListOfcards);
            } catch (error) {
                console.log('Failed to fetch card');
            }
        };
        getRandomList();
    }, []);

    const searchCardByName = () => {
        if (!cardInput.trim()) return;
        fetchCardByName(cardInput).then((item) => {
            setSearchedCards(item);
        });
        setCardInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            searchCardByName();
        }
    };

    const displayListofCards = (cards: Card[]) =>
        cards.map((card, index) => <CardItem key={index} obj={card} />);

    return (
        <Wrapper>
            <SearchSection>
                <Title>Magic: The Gathering Cards</Title>
                <SearchBar>
                    <StyledInput
                        value={cardInput}
                        onChange={(e) => setCardInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by card name..."
                    />
                    <StyledButton onClick={searchCardByName} name="Search" />
                </SearchBar>
            </SearchSection>

            <CardGrid>
                {searchedCards.length > 0
                    ? displayListofCards(searchedCards)
                    : displayListofCards(listOfcards)}
            </CardGrid>
        </Wrapper>
    );
};

export default CardPage;

/* ---------- Styled Components ---------- */

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: #f9fafb;
`;

const Title = styled.h1`
    font-size: 1.8rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1.5rem;
    text-align: center;
`;

const SearchSection = styled.div`
    width: 100%;
    max-width: 800px;
    background: #fff;
    padding: 1.5rem 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    margin-bottom: 2rem;
`;

const SearchBar = styled.div`
    display: flex;
    gap: 0.75rem;
    align-items: center;
`;

const StyledInput = styled(Input)`
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border-radius: 8px;
    border: 1px solid #d1d5db;
`;

const StyledButton = styled(Button)`
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
`;

const CardGrid = styled.div`
    width: 100%;
    max-width: 90vw;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
    justify-items: center;
    padding-bottom: 2rem;
    max-height: 60vh;
    overflow-y: scroll;
`;
