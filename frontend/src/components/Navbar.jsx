import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <Link to="/" className="brand">ArenaX</Link>
      <nav>
        <NavLink className={linkClass} to="/map">الخريطة</NavLink>
        <NavLink className={linkClass} to="/events">البطولات</NavLink>
        <NavLink className={linkClass} to="/news">الأخبار</NavLink>
        {(user?.role === 'Admin' || user?.role === 'Coach_ClubOwner') && (
          <NavLink className={linkClass} to="/dashboard">لوحة المدرب</NavLink>
        )}
      </nav>
      <div className="nav-auth">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-sm" onClick={logout}>خروج</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-sm">دخول</Link>
            <Link to="/register" className="btn btn-sm btn-primary">تسجيل</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;