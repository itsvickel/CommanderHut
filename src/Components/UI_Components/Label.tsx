
import styled from 'styled-components';

interface Props {
  name: string; 
}

const Label = ({ name }: Props) => {
  return (
    <LabelContainer>{name}</LabelContainer>
  );
};

export default Label;

const LabelContainer = styled.div`
    font-size: 2em;
`;
