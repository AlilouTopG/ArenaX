import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0, revenue: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/subscriptions', { params: { limit: 100 } })
      .then(({ data }) => {
        const subs = data.data.subscriptions;
        const now = new Date();
        const active = subs.filter((s) => s.status === 'Active');
        setStats({
          total: subs.length,
          active: active.length,
          expiring: subs.filter((s) => s.status === 'ExpiringSoon').length,
          expired: subs.filter((s) => s.status === 'Expired').length,
          revenue: subs.reduce((sum, s) => sum + s.amountPaid, 0),
          expiringToday: active.filter((s) => {
            const end = new Date(s.endDate);
            return end > now && end.getTime() - now.getTime() <= 3 * 86400000;
          }).length,
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div>
      <h1>لوحة المدرب</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <p className="muted">مرحباً، {user?.name}</p>
        <div className="stat-grid">
          <div className="stat"><span>{stats.total}</span><label>إجمالي الاشتراكات</label></div>
          <div className="stat"><span>{stats.active}</span><label>نشطة</label></div>
          <div className="stat"><span>{stats.expiring}</span><label>قرب الانتهاء</label></div>
          <div className="stat"><span>{stats.expired}</span><label>منتهية</label></div>
          <div className="stat"><span>{stats.revenue}</span><label>إجمالي المدفوعات</label></div>
        </div>
      </div>
      <div className="features">
        <Link to="/dashboard/subscriptions" className="card action-card">
          <h3>إدارة الاشتراكات</h3>
          <p>تسجيل مشتركين جدد، تجديد، وتعديل الاشتراكات.</p>
        </Link>
        <Link to="/dashboard/settings" className="card action-card">
          <h3>إعدادات التنبيهات</h3>
          <p>اربط Telegram أو WhatsApp واستقبل إشعارات فورية.</p>
        </Link>
      </div>
    </div>
  );
};

export default CoachDashboard;