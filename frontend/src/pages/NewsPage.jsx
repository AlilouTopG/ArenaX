import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../api/client.js';

const CATEGORY_LABELS = {
  Football: 'كرة القدم',
  Bodybuilding: 'كمال الأجسام',
  'Boxing & Combat': 'الملاكمة والقتال',
};

const NewsSkeleton = () => (
  <div className="news-grid">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="card news-card skeleton-card">
        <div className="skeleton skeleton-image" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text short" />
      </div>
    ))}
  </div>
);

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (cat = category) => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 12 };
      if (cat) params.category = cat;
      const { data } = await client.get('/news', { params });
      setNews(data.data.news);
    } catch (err) {
      setNews([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCategory = (cat) => {
    setCategory(cat);
    load(cat);
  };

  return (
    <div>
      <h1>الأخبار الرياضية الذكية</h1>
      <div className="chip-row">
        <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => onCategory('')}>الكل</button>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button key={value} className={`chip ${category === value ? 'active' : ''}`} onClick={() => onCategory(value)}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="btn btn-sm" onClick={() => load()}>إعادة المحاولة</button>
        </div>
      )}

      {loading && <NewsSkeleton />}

      {!loading && !error && (
        <>
          <div className="news-grid">
            {news.map((item) => (
              <article key={item._id} className="card news-card">
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} loading="lazy" />}
                <h3>{item.title}</h3>
                <p className="muted">{item.summary}</p>
                <footer className="news-meta">
                  <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString('ar-EG')}</span>
                </footer>
                {item.aiProcessed && <span className="badge">AI</span>}
              </article>
            ))}
          </div>
          {news.length === 0 && <p className="muted">لا توجد أخبار بعد.</p>}
        </>
      )}
    </div>
  );
};

export default NewsPage;