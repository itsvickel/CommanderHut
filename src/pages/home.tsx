import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import { selectIsAuthenticated, selectCurrentUser } from '../store/AuthSlice';

const Home: React.FC = () => {
    const isLogged = useSelector(selectIsAuthenticated);
    const username = useSelector(selectCurrentUser)?.username;

    return (
        <HomeContainer>
            <h1>Welcome to MTG AI</h1>
            {isLogged ? `Hello ${username}, how are you doing?` : null}
        </HomeContainer>
    );
};

export default Home;

const HomeContainer = styled.div``;
