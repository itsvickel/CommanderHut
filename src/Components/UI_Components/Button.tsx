// src/Components/Button.tsx

import styled from 'styled-components';

interface Props {
  name?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const Button = ({ name, onClick, disabled }: Props) => {
  return <ButtonContainer onClick={onClick} disabled={disabled}>{name}</ButtonContainer>;
};

export default Button;

const ButtonContainer = styled.button`
  padding: 10px 16px;
  background-color: #4c6ef5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #3b5bdb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
