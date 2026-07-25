import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { postRegisterUser } from '../services/userService';
import { Button, Input } from '../Components/UI_Components';
import { authCheckSucceeded } from '../store/AuthSlice';
import { safeRedirect } from '../utils/safeRedirect';

const RegisterUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const registerNewUser = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const registered = await postRegisterUser({
        username,
        email_address: emailAddress,
        password,
      });

      if (!registered?.user?._id) {
        setError('Registration failed — please try again');
        return;
      }

      dispatch(authCheckSucceeded({
        id: registered.user._id,
        username: registered.user.username,
        email_address: registered.user.email_address,
      }));

      navigate(safeRedirect(location.search), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Registration failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-center text-2xl font-bold mb-6">Register</h2>

        <div className="flex flex-col mb-4">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>

        <div className="flex flex-col mb-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>

        <div className="flex flex-col mb-4">
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Your email"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400 text-center mb-3">
            {error}
          </p>
        )}

        <Button onClick={registerNewUser} name={submitting ? 'Registering…' : 'Register'} />

        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 no-underline font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;
