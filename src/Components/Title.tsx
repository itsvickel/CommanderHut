import styled from "styled-components";

interface Props {
    children: React.ReactNode
}

const Navbar = ({ children }: Props) => {
    return (
        <div>
            <Title>{children}</Title>
        </div>
    );
};

export default Navbar;

const Title = styled.div`
    
`;