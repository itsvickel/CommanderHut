import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAuthStatus } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props {
  children: ReactNode;
}

const RequireAuth = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  if (status === 'idle' || status === 'checking') {
    return <Spinner />;
  }

  if (status === 'unauthenticated') {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
