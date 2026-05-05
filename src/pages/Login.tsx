import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input, Button } from '../Components/UI_Components';
import { loginUser } from '../services/userService';
import { authCheckSucceeded } from '../store/AuthSlice';
import { safeRedirect } from '../utils/safeRedirect';

const Authentication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    loginUser({ email_address: email, password })
      .then((res) => {
        if (res && res.data?.user) {
          dispatch(authCheckSucceeded(res.data.user));
          navigate(safeRedirect(location.search), { replace: true });
        }
      })
      .catch((err) => console.error('Login failed:', err));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h2 className="text-center text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Login</h2>
      <div className="flex flex-col my-4 mx-2">
        <Input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col my-4 mx-2">
        <Input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex justify-center mt-4">
        <Button onClick={onLogin} name="Login" />
      </div>
    </div>
  );
};

export default Authentication;
