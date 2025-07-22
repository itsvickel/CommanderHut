import styled from 'styled-components';

interface Props {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  placeholder?: string;
}

const Input = ({ onChange, value, placeholder }: Props) => {
  return (
    <StyledInput
      type="text"
      onChange={onChange}
      value={value}
      placeholder={placeholder}
    />
  );
};

export default Input;

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  color: #fff;
`;
