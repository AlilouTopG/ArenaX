import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const { register, getErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'User' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'Admin' || user.role === 'Coach_ClubOwner' ? '/dashboard' : '/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1>إنشاء حساب</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>الاسم الكامل</label>
        <input type="text" name="name" value={form.name} onChange={onChange} required />
        <label>البريد الإلكتروني</label>
        <input type="email" name="email" value={form.email} onChange={onChange} required />
        <label>الهاتف</label>
        <input type="tel" name="phone" value={form.phone} onChange={onChange} />
        <label>كلمة المرور</label>
        <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8} />
        <label>نوع الحساب</label>
        <select name="role" value={form.role} onChange={onChange}>
          <option value="User">عضو</option>
          <option value="Coach_ClubOwner">مدرب / صاحب صالة</option>
        </select>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'جاري الإنشاء...' : 'تسجيل'}
        </button>
      </form>
    </div>
  );
};

export default Register;