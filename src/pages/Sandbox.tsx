import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCardByName, fetchCardByQuery, fetchListOfRandomCards } from '../services/cardService';
import { setCard, setLoading, setError } from '../store/cardSlice';

import styled from 'styled-components';
import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import CardItem from '../Components/CardItem';
import DeckImport from '../Components/DeckImport';
import Tabs from '../Components/Tabs';

 
  const Sandbox = () => {

    const Navigation: {key: number, title: String, component:  React.ReactElement}[] = [
      {
        key: 0,
        title: "Import Deck",
        component: <DeckImport />
      }, 
      {
        key: 1,
        title: "Create your own",
        component: <div>hey</div>
      },
    ];

    useEffect(() => {

       

    }, [ ]);

  
    return (
        <div>
            Deck List
            <MainComponent>
              
              
              <Tabs obj={Navigation} />


                {/* Import decks */}
                {/* List of decks */}
                {/* Create your own deck */}
                
            </MainComponent>
        </div>
    );
};

export default Sandbox;

const MainComponent = styled.div`

`;
