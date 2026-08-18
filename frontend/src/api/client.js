import axios from 'axios';

const BASE_URL = '/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('arenax_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('arenax_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('arenax_access_token', data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return client(original);
        } catch (_refreshError) {
          localStorage.removeItem('arenax_access_token');
          localStorage.removeItem('arenax_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  },
);

const FALLBACK_MESSAGES = {
  400: 'البيانات المرسلة غير صحيحة، تحقق من المدخلات.',
  401: 'انتهت الجلسة، سجّل الدخول من جديد.',
  403: 'لا تملك صلاحية للقيام بهذه العملية.',
  404: 'المورد المطلوب غير موجود.',
  409: 'هذه البيانات موجودة مسبقاً.',
  429: 'تم تجاوز عدد الطلبات المسموح، حاول بعد قليل.',
  500: 'حدث خطأ في الخادم، حاول مرة أخرى لاحقاً.',
};

export const getErrorMessage = (error, fallback = 'حدث خطأ في الاتصال، حاول مرة أخرى.') => {
  if (!error) return fallback;

  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
    return 'تعذر الاتصال بالخادم، تأكد من تشغيل الـ Backend ثم أعد المحاولة.';
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message;
  if (serverMessage) return serverMessage;

  const validationDetails = error.response.data?.details;
  if (Array.isArray(validationDetails) && validationDetails.length > 0) {
    return validationDetails.map((d) => d.message).join(' - ');
  }

  return FALLBACK_MESSAGES[status] || fallback;
};

export default client;