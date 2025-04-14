import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCardByName, fetchCardByQuery, fetchListOfRandomCards } from '../services/cardService';
import { setCard, setLoading, setError } from '../store/cardSlice';

import styled from 'styled-components';
import Button from '../Components/Button';
import Input from '../Components/Input';
import CardItem from '../Components/CardItem';

// Define the type of the card if not already defined
interface Card {
    name: string;
    image_uris: {
      normal: string;
    };
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
            } catch (error: any) {
                console.log('Failed to fetch card');
            }
        };

        getRandomList();

    }, [ ]);

    const searchCardByName = () =>{
        setCardInput('');

        fetchCardByName(cardInput).then((item)=>{
            setSearchedCards(item);
        });
    }
    const displayListofCards = (cards: Card[]) => {
        return cards.map((card, index) => (
          <CardItem
            key={index}
            obj={card}
          />
        ));
      };

    return (
        <div>
            cards list

            <MainComponent>
               <Input onChange={(e)=>setCardInput(e.target.value)} /> <Button onClick={searchCardByName} name="Search"/>
            <CardContainer>
 
            {
                searchedCards.length > 0
                ? displayListofCards(searchedCards)
                : displayListofCards(listOfcards)
            }
          
               </CardContainer>
 
            </MainComponent>
        </div>
    );
};

export default CardPage;

const MainComponent = styled.div`

`;

const CardContainer = styled.div`
    height: 80vh;
    width: 90vw;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    margin-top: 1rem;
    overflow: auto;

`;