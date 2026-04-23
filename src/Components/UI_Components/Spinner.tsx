import styled, { keyframes } from 'styled-components';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  size?: Size;
  label?: string;
}

const SIZE_PX: Record<Size, number> = { sm: 16, md: 32, lg: 48 };

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Circle = styled.div<{ $px: number }>`
  width: ${(p) => p.$px}px;
  height: ${(p) => p.$px}px;
  border: 3px solid #e5e7eb;
  border-top-color: #4c6ef5;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Spinner = ({ size = 'md', label = 'Loading' }: Props) => (
  <Wrapper role="status" aria-live="polite">
    <Circle $px={SIZE_PX[size]} />
    <VisuallyHidden>{label}</VisuallyHidden>
  </Wrapper>
);

export default Spinner;
