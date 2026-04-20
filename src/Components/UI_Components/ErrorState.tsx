import styled from 'styled-components';
import colors from '../../styles/colors.js';

interface Props {
  message: string;
  retry?: () => void;
}

const ErrorState = ({ message, retry }: Props) => (
  <Wrapper role="alert">
    <Heading>Something went wrong</Heading>
    <Message>{message}</Message>
    {retry && <RetryButton onClick={retry}>Try again</RetryButton>}
  </Wrapper>
);

export default ErrorState;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
`;

const Heading = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.black};
  margin: 0;
`;

const Message = styled.p`
  color: ${colors.lightGrey};
  margin: 0;
`;

const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4c6ef5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;

  &:hover {
    background-color: #3b5bdb;
  }
`;
