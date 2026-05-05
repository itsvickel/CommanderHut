interface Props {
    children: React.ReactNode
}

const Navbar = ({ children }: Props) => {
    return (
        <div>
            <div>{children}</div>
        </div>
    );
};

export default Navbar;
