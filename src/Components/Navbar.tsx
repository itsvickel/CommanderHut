import { Link } from 'react-router-dom';

interface Props {
    obj: [{
        name: string;
        to: string;
    }]
}

const Navbar = ({ obj }: Props) => {
    return (
        <nav>
            <ul style={{ display: 'flex', justifyContent: 'space-around', listStyleType: 'none', padding: '1rem' }}>
                {obj.map((item) => {
                    return <li><Link to={item.to}>{item.name}</Link></li>
                })}
            </ul>
        </nav>
    );
};

export default Navbar;
