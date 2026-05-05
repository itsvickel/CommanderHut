import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../store/AuthSlice';

const Home = () => {
  const isLogged = useSelector(selectIsAuthenticated);
  const username = useSelector(selectCurrentUser)?.username;

  return (
    <div className="text-center p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome to MTG AI</h1>
      {isLogged && (
        <p className="text-gray-600 dark:text-gray-400">Hello {username}, how are you doing?</p>
      )}
    </div>
  );
};

export default Home;
