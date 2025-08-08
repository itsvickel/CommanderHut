import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: ${({ theme }: any) => theme.colors.background};
    color: ${({ theme }: any) => theme.colors.text};
    font: ${({ theme }: any) => theme.typography.body};
    font-family: ${({ theme }: any) => theme.typography.fontFamily};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  h1 { font: ${({ theme }: any) => theme.typography.h1}; margin: 0 0 ${({ theme }: any) => theme.spacing.lg}; }
  h2 { font: ${({ theme }: any) => theme.typography.h2}; margin: 0 0 ${({ theme }: any) => theme.spacing.md}; }
  a { color: inherit; text-decoration: none; }
  ul { margin: 0; padding: 0; }
`;

export default GlobalStyle;