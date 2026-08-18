import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h2>لا تملك صلاحية الوصول</h2>
        <p>هذه الصفحة مخصصة لمديري الصالات فقط.</p>
        <Link to="/" className="btn">العودة للرئيسية</Link>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;