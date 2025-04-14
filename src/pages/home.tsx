import React, { useEffect } from 'react';

import styled from 'styled-components';
import CardPage from './CardPage';
import AIGenerate from './AIGenerate';

const Home: React.FC = () => {


    return (
        <HomeContainer>
            {/* <CardPage /> */}
            <AIGenerate />
        </HomeContainer>
    );
};

export default Home;

const HomeContainer = styled.div``;