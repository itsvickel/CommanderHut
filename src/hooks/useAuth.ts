import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login, logout } from '../store/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_ME_BASE_URL}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Not logged in');
        const user = await res.json();
        dispatch(login({
          id: user.id,
          username: user.username,
          email_address: user.email_address,
        }));
      } catch (err) {
        dispatch(logout());
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useAuth;