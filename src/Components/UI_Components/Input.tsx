import styled from 'styled-components';

interface Props {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  placeholder?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = ({ onChange, value, placeholder, onBlur, onFocus }: Props) => {
  return (
    <StyledInput
      type="text"
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
};

export default Input;

const StyledInput = styled.input`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 1rem;
  width: 100%;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(44, 123, 229, 0.15);
  }
`;
