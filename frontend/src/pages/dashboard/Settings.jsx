import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../../api/client.js';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const { data } = await client.get('/coach/settings');
      setSettings(data.data.settings);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateNotification = async (key, value) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await client.patch('/coach/settings', {
        notifications: { ...settings.notifications, [key]: value },
      });
      setSettings(data.data.settings);
      setSuccess('تم حفظ الإعدادات');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const linkTelegram = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const { data } = await client.post('/coach/settings/telegram/link', { authToken: telegramToken });
      setSettings(data.data.settings);
      setTelegramToken('');
      setSuccess('تم ربط Telegram بنجاح');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const testNotification = async () => {
    setError('');
    setSuccess('');
    try {
      const { data } = await client.post('/coach/settings/test');
      setSuccess(`تم إرسال اختبار (${data.data.delivered.join(', ') || 'لا يوجد قناة مفعلة'})`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!settings) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1>إعدادات التنبيهات</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h3>Telegram</h3>
        {settings.telegram?.enabled ? (
          <p className="muted">متصل برقم الدردشة: {settings.telegram.chatId}</p>
        ) : (
          <form onSubmit={linkTelegram}>
            <p className="muted">أنشئ بوتاً عبر BotFather، ثم ابدأ محادثة معه وأدخل التوكن هنا.</p>
            <label>Bot Token</label>
            <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} required />
            <button className="btn btn-primary">ربط Telegram</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>التفضيلات</h3>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.notifications.onNewSubscription}
            onChange={(e) => updateNotification('onNewSubscription', e.target.checked)}
          />
          إشعار عند تسجيل مشترك جديد
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.notifications.onRenewal}
            onChange={(e) => updateNotification('onRenewal', e.target.checked)}
          />
          إشعار عند تجديد اشتراك
        </label>
        <label>تنبيه قبل (أيام) من انتهاء الاشتراك</label>
        <input
          type="number"
          min="1"
          max="14"
          value={settings.notifications.expiryReminderDays}
          onChange={(e) => updateNotification('expiryReminderDays', Number(e.target.value))}
        />
      </div>

      <button className="btn" onClick={testNotification}>إرسال إشعار تجريبي</button>
    </div>
  );
};

export default Settings;