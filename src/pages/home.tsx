import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Home: React.FC = () => {
  const isLogged = useSelector((state: RootState) => state.auth.isAuthenticated);
  const username = useSelector((state: RootState) => state.auth.user?.username);
  return (
    <HomeContainer>
      <h1>Welcome to MTG AI</h1>
      {isLogged ? `Hello ${username}, how are you doing?` : null}
    </HomeContainer>
  );
};

export default Home;

const HomeContainer = styled.div``;