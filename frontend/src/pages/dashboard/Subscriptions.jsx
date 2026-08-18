import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../../api/client.js';

const EMPTY_FORM = {
  gymId: '',
  memberName: '',
  memberPhone: '',
  sportType: 'Bodybuilding',
  amountPaid: '',
  paymentMethod: 'Cash',
  startDate: '',
  endDate: '',
  notes: '',
};

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSubscriptions = async () => {
    try {
      const { data } = await client.get('/subscriptions');
      setSubscriptions(data.data.subscriptions);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadGyms = async () => {
    try {
      const { data } = await client.get('/gyms/me/gym');
      const gym = data.data.gym;
      setGyms([gym]);
      setForm((f) => ({ ...f, gymId: gym._id }));
    } catch {
      setGyms([]);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadGyms();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await client.post('/subscriptions', form);
      setForm({ ...EMPTY_FORM, gymId: form.gymId, sportType: form.sportType, paymentMethod: form.paymentMethod });
      setSuccess('تم تسجيل الاشتراك بنجاح');
      await loadSubscriptions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>إدارة الاشتراكات</h1>
      <div className="two-col">
        <div className="card">
          <h3>تسجيل مشترك (دفع كاش)</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={onSubmit}>
            <label>الصالة</label>
            <select name="gymId" value={form.gymId} onChange={onChange} required>
              <option value="">اختر الصالة</option>
              {gyms.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
            <label>اسم المشترك</label>
            <input type="text" name="memberName" value={form.memberName} onChange={onChange} required />
            <label>هاتف المشترك</label>
            <input type="tel" name="memberPhone" value={form.memberPhone} onChange={onChange} />
            <label>نوع الرياضة</label>
            <select name="sportType" value={form.sportType} onChange={onChange}>
              <option value="Bodybuilding">كمال أجسام</option>
              <option value="Football">كرة قدم</option>
              <option value="Boxing">ملاكمة</option>
              <option value="Combat">فنون قتالية</option>
              <option value="Mixed">مختلط</option>
            </select>
            <label>المبلغ المدفوع</label>
            <input type="number" step="0.01" name="amountPaid" value={form.amountPaid} onChange={onChange} required />
            <label>طريقة الدفع</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
              <option value="Cash">كاش</option>
              <option value="Card">بطاقة</option>
              <option value="Online">أونلاين</option>
            </select>
            <label>تاريخ البداية</label>
            <input type="date" name="startDate" value={form.startDate} onChange={onChange} required />
            <label>تاريخ الانتهاء</label>
            <input type="date" name="endDate" value={form.endDate} onChange={onChange} required />
            <label>ملاحظات</label>
            <textarea name="notes" value={form.notes} onChange={onChange} rows="2" />
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'تسجيل الاشتراك'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>الاشتراكات الحالية</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>الرياضة</th>
                  <th>المبلغ</th>
                  <th>الانتهاء</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s._id}>
                    <td>{s.memberName}</td>
                    <td>{s.sportType}</td>
                    <td>{s.amountPaid}</td>
                    <td>{new Date(s.endDate).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan="5" className="muted">لا توجد اشتراكات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;