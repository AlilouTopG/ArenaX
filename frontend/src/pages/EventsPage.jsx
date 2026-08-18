import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const SPORT_LABELS = {
  Football: 'كرة القدم',
  Bodybuilding: 'كمال الأجسام',
  Boxing: 'ملاكمة',
  Combat: 'فنون قتالية',
  Mixed: 'مختلط',
  Tennis: 'تنس',
  Basketball: 'كرة السلة',
  Other: 'أخرى',
};

const EMPTY_FORM = {
  title: '',
  sportType: 'Football',
  location: '',
  eventDate: '',
  entryFee: '',
  registrationUrl: '',
  description: '',
};

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCoach = user?.role === 'Admin' || user?.role === 'Coach_ClubOwner';

  const load = async (sport = filter) => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 30, upcoming: 'true' };
      if (sport) params.sportType = sport;
      const { data } = await client.get('/events', { params });
      setEvents(data.data.events);
    } catch (err) {
      setEvents([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilter = (sport) => {
    setFilter(sport);
    load(sport);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await client.post('/events', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess('تم نشر الفعالية بنجاح');
      await load(filter);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الفعالية؟')) return;
    try {
      await client.delete(`/events/${id}`);
      setSuccess('تم حذف الفعالية');
      await load(filter);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1>البطولات والفعاليات الرياضية</h1>

      <div className="chip-row">
        <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => onFilter('')}>الكل</button>
        {Object.entries(SPORT_LABELS).map(([value, label]) => (
          <button key={value} className={`chip ${filter === value ? 'active' : ''}`} onClick={() => onFilter(value)}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <p className="muted">جاري التحميل...</p>}

      {isCoach && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'إغلاق' : '+ إضافة فعالية جديدة'}
          </button>
          {showForm && (
            <form onSubmit={onCreate}>
              <label>عنوان الفعالية</label>
              <input type="text" name="title" value={form.title} onChange={onChange} required />
              <label>نوع الرياضة</label>
              <select name="sportType" value={form.sportType} onChange={onChange}>
                {Object.entries(SPORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label>المكان / الصالة</label>
              <input type="text" name="location" value={form.location} onChange={onChange} required />
              <label>تاريخ الفعالية</label>
              <input type="datetime-local" name="eventDate" value={form.eventDate} onChange={onChange} required />
              <label>سعر المشاركة</label>
              <input type="number" min="0" step="0.01" name="entryFee" value={form.entryFee} onChange={onChange} />
              <label>رابط التسجيل</label>
              <input type="url" name="registrationUrl" value={form.registrationUrl} onChange={onChange} />
              <label>وصف</label>
              <textarea name="description" value={form.description} onChange={onChange} rows="3" />
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري النشر...' : 'نشر الفعالية'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="events-grid">
        {events.map((event) => (
          <article key={event._id} className="card event-card">
            <h3>{event.title}</h3>
            <div className="event-meta">
              <span>{SPORT_LABELS[event.sportType] || event.sportType}</span>
              <span>{new Date(event.eventDate).toLocaleDateString('ar-EG')}</span>
              <span>{event.entryFee > 0 ? `${event.entryFee} دج` : 'مجاني'}</span>
            </div>
            <p className="muted">{event.location}</p>
            {event.gym?.name && <p className="muted">الصالة: {event.gym.name} - {event.gym.city}</p>}
            {event.description && <p className="muted">{event.description}</p>}
            <div className="event-actions">
              {event.registrationUrl ? (
                <a className="btn btn-primary" href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                  سجّل الآن
                </a>
              ) : (
                <span className="muted">التسجيل في المكان</span>
              )}
              {isCoach && (
                <button className="btn btn-sm" onClick={() => onDelete(event._id)}>حذف</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && events.length === 0 && <p className="muted">لا توجد فعاليات قادمة.</p>}
    </div>
  );
};

export default EventsPage;