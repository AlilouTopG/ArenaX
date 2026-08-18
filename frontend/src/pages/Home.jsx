import { Link } from 'react-router-dom';

const Home = () => (
  <section>
    <div className="hero">
      <h1>منصة ArenaX الرياضية الجامعية</h1>
      <p>دليل الصالات، الخريطة التفاعلية، الأخبار الذكية، وإدارة الاشتراكات في مكان واحد.</p>
      <div className="hero-actions">
        <Link to="/map" className="btn btn-primary">استكشف الخريطة</Link>
        <Link to="/news" className="btn">آخر الأخبار</Link>
      </div>
    </div>
    <div className="features">
      <div className="card"><h3>خريطة تفاعلية</h3><p>اعثر على أقرب صالة وفق الرياضة والسعر.</p></div>
      <div className="card"><h3>أخبار ذكية</h3><p>أخبار رياضية عربية مصنفة ومولّدة بالذكاء الاصطناعي.</p></div>
      <div className="card"><h3>إدارة الاشتراكات</h3><p>لوحة مدرب متكاملة مع تنبيهات Telegram / WhatsApp.</p></div>
    </div>
  </section>
);

export default Home;