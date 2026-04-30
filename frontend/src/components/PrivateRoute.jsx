import { Navigate, useLocation } from 'react-router-dom';

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('tripmate_token');

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('tripmate_token');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
