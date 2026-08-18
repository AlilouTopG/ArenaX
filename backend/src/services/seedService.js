import User from '../models/User.js';
import Gym from '../models/Gym.js';
import Subscription from '../models/Subscription.js';
import Event from '../models/Event.js';
import News from '../models/News.js';
import logger from '../utils/logger.js';

const ALGERIAN_GYMS = [
  {
    name: 'ArenaX Fitness Algiers',
    description: 'نادي رياضي متكامل في قلب الجزائر العاصمة',
    sportTypes: ['Bodybuilding', 'Football', 'Mixed'],
    subscriptionPrices: { monthly: 50, quarterly: 130, yearly: 450 },
    location: { type: 'Point', coordinates: [3.0588, 36.7538] },
    address: 'Rue Didouche Mourad, Alger Centre',
    city: 'Algiers',
    country: 'DZ',
    contactPhone: '+213550000001',
  },
  {
    name: 'Oran Boxing Academy',
    description: 'أكاديمية متخصصة في الملاكمة والفنون القتالية',
    sportTypes: ['Boxing', 'Combat'],
    subscriptionPrices: { monthly: 40, quarterly: 105, yearly: 350 },
    location: { type: 'Point', coordinates: [-0.6417, 35.6969] },
    address: 'Boulevard de la Soummam, Oran',
    city: 'Oran',
    country: 'DZ',
    contactPhone: '+213550000002',
  },
  {
    name: 'Constantine Bodybuilding Club',
    description: 'نادي كمال أجسام وتغذية رياضية',
    sportTypes: ['Bodybuilding'],
    subscriptionPrices: { monthly: 45, quarterly: 120, yearly: 400 },
    location: { type: 'Point', coordinates: [6.6147, 36.365] },
    address: 'Cité El Bouni, Constantine',
    city: 'Constantine',
    country: 'DZ',
    contactPhone: '+213550000003',
  },
  {
    name: 'Annaba Football & Fitness',
    description: 'مركز كرة قدم ولياقة بدنية',
    sportTypes: ['Football', 'Mixed'],
    subscriptionPrices: { monthly: 35, quarterly: 90, yearly: 300 },
    location: { type: 'Point', coordinates: [7.7667, 36.9] },
    address: 'Boulevard du 1er Novembre, Annaba',
    city: 'Annaba',
    country: 'DZ',
    contactPhone: '+213550000004',
  },
  {
    name: 'Blida Combat Arena',
    description: 'قاعة فنون قتالية وملاكمة',
    sportTypes: ['Combat', 'Boxing', 'Mixed'],
    subscriptionPrices: { monthly: 45, quarterly: 115, yearly: 380 },
    location: { type: 'Point', coordinates: [2.8277, 36.4702] },
    address: 'Route de Chiffa, Blida',
    city: 'Blida',
    country: 'DZ',
    contactPhone: '+213550000005',
  },
  {
    name: 'Setif Sports Center',
    description: 'مركز رياضي متعدد التخصصات',
    sportTypes: ['Football', 'Bodybuilding', 'Mixed'],
    subscriptionPrices: { monthly: 40, quarterly: 100, yearly: 340 },
    location: { type: 'Point', coordinates: [5.4137, 36.1911] },
    address: 'Avenue du 8 Mai 1945, Setif',
    city: 'Setif',
    country: 'DZ',
    contactPhone: '+213550000006',
  },
];

const SAMPLE_EVENTS = [
  {
    title: 'بطولة الجزائر الوطنية لكمال الأجسام 2026',
    description: 'بطولة وطنية كبرى بمشاركة أبطال الولايات',
    sportType: 'Bodybuilding',
    location: 'قاعة سيدار - الجزائر العاصمة',
    eventDate: new Date(Date.now() + 30 * 86400000),
    entryFee: 500,
    registrationUrl: 'https://arenax.app/register/bodybuilding-2026',
  },
  {
    title: 'دورة الملاكمة الولائية - وهران',
    description: 'منافسات محلية للملاكمين الهواة',
    sportType: 'Boxing',
    location: 'المركب الأولمبي - وهران',
    eventDate: new Date(Date.now() + 12 * 86400000),
    entryFee: 0,
    registrationUrl: null,
  },
  {
    title: 'بطولة قسنطينة للفوتسال',
    description: 'بطولة خماسيات بجوائز مالية',
    sportType: 'Football',
    location: 'القاعة المتعددة الرياضات - قسنطينة',
    eventDate: new Date(Date.now() + 20 * 86400000),
    entryFee: 200,
    registrationUrl: 'https://arenax.app/register/futsal-cst',
  },
  {
    title: 'ليلة القتال - عنابة',
    description: 'منافسات MMA بين أندية الشرق الجزائري',
    sportType: 'Combat',
    location: 'قاعة عائشة - عنابة',
    eventDate: new Date(Date.now() + 45 * 86400000),
    entryFee: 350,
    registrationUrl: null,
  },
];

const SAMPLE_NEWS = [
  {
    title: 'المنتخب الجزائري يفتتح التصفيات بفوز ثمين',
    summary: 'حقق المنتخب الوطني فوزاً مهماً في مستهل مشواره التصفوي بفضل أداء جماعي مميز وتركيز عالٍ من اللاعبين.',
    category: 'Football',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Algeria opens qualifiers with valuable win',
    aiProcessed: true,
  },
  {
    title: 'لاعب جزائري يتألق في الدوري الأوروبي',
    summary: 'خطف النجم الجزائري الأضواء بعد تسجيله هدفاً حاسماً قاد به فريقه للفوز في الجولة الأخيرة من المسابقة القارية.',
    category: 'Football',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Algerian player shines in European league',
    aiProcessed: true,
  },
  {
    title: 'بطل كمال الأجسام الجزائري يستعد لبطولة العالم',
    summary: 'يكثف البطل الوطني تدريباته استعداداً للمشاركة في المحفل العالمي رفقة نخبة من أبطال القارة الأفريقية.',
    category: 'Bodybuilding',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Algerian bodybuilding champion prepares for Worlds',
    aiProcessed: true,
  },
  {
    title: 'نصائح غذائية للاعبي كمال الأجسام قبل المنافسات',
    summary: 'يستعرض الخبراء أهم الخطوات الغذائية التي تساعد اللاعبين على الوصول لأعلى جاهزية بدنية قبل المواسم.',
    category: 'Bodybuilding',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Nutrition tips for bodybuilders pre-season',
    aiProcessed: true,
  },
  {
    title: 'الملاكم الجزائري يتأهل للدورة الأولمبية',
    summary: 'ضمن الملاكم الوطني مقعده في الأولمبياد بعد سلسلة نتائج قوية أهلته للصعود من التصفيات القارية.',
    category: 'Boxing & Combat',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Algerian boxer qualifies for Olympics',
    aiProcessed: true,
  },
  {
    title: 'مؤتمر صحفي لبطولة القتال المختلط المرتقبة',
    summary: 'كشفت الجهة المنظمة عن تفاصيل البطولة القادمة ومواجهاتها المرتقبة بحضور نخبة من المقاتلين العرب.',
    category: 'Boxing & Combat',
    source: 'ArenaX AI Engine',
    sourceUrl: null,
    originalTitle: 'Press conference for upcoming MMA event',
    aiProcessed: true,
  },
];

const seedUsers = async () => {
  if ((await User.countDocuments()) > 0) return 0;

  const coach = await User.create({
    name: 'Coach Demo',
    email: 'coach@arenax.app',
    password: 'Coach@12345',
    phone: '+213550000000',
    role: 'Coach_ClubOwner',
  });

  await User.create({
    name: 'ArenaX Admin',
    email: 'admin@arenax.app',
    password: 'Admin@12345',
    role: 'Admin',
  });

  await User.create({
    name: 'Member Demo',
    email: 'member@arenax.app',
    password: 'Member@12345',
    role: 'User',
  });

  return { coach, count: 3 };
};

const seedGyms = async (coach) => {
  if ((await Gym.countDocuments()) > 0) return [];

  const gyms = await Gym.create(
    ALGERIAN_GYMS.map((g) => ({
      ...g,
      owner: coach?._id ?? null,
      isVerified: true,
    })),
  );
  return gyms;
};

const seedSubscriptions = async (coach, gyms) => {
  if (coach && gyms.length && (await Subscription.countDocuments()) === 0) {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 25);
    await Subscription.create({
      gym: gyms[0]._id,
      coach: coach._id,
      memberName: 'Member Demo',
      memberPhone: '+213550000009',
      sportType: 'Bodybuilding',
      amountPaid: 50,
      paymentMethod: 'Cash',
      startDate: today,
      endDate: end,
    });
  }
};

const seedEvents = async (coach, gyms) => {
  if ((await Event.countDocuments()) > 0) return;

  await Event.create(
    SAMPLE_EVENTS.map((e, i) => ({
      ...e,
      gym: gyms[i % gyms.length]?._id ?? null,
      createdBy: coach?._id ?? null,
    })),
  );
};

const seedNews = async () => {
  if ((await News.countDocuments()) > 0) return;

  await News.create(
    SAMPLE_NEWS.map((n, i) => ({
      ...n,
      content: n.summary,
      originalContentHash: `sample-news-${i}`,
      isPublished: true,
      publishedAt: new Date(Date.now() - i * 86400000),
      language: 'ar',
    })),
  );
};

export const seedDemoData = async () => {
  const { coach } = await seedUsers();
  const gyms = await seedGyms(coach);
  await seedSubscriptions(coach, gyms);
  await seedEvents(coach, gyms);
  await seedNews();
  logger.info('Demo data seed completed');
  return { users: 3, gyms: gyms.length, events: SAMPLE_EVENTS.length, news: SAMPLE_NEWS.length };
};