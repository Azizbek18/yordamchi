
-- 1. 'tasks' jadvalini yaratish
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'xarid', 'tamirlash', 'yetkazish', 'tozalash', 'raqamli', 'boshqa'
    price INTEGER NOT NULL,
    location TEXT NOT NULL,
    distance NUMERIC(3,1) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) ni o'chirish (anonim foydalanuvchilar ham o'qiy olishi uchun)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 2. Dastlabki namunaviy ma'lumotlarni qo'shish
INSERT INTO tasks (title, description, category, price, location, distance, created_at) VALUES
('Aptekadan dori va vitamin olib kelish', 'Yunusobod 4-mavze yaqinidagi dorixonadan retsept asosida dori va vitaminlar sotib olib keltirish kerak.', 'xarid', 45000, 'Yunusobod 4-mavze', 2.4, now() - interval '15 minutes'),
('Samsung muzlatgichni ta''mirlash', 'Muzlatgich sovitishni to''xtatdi, usta ko''rib berishi zarur. Mirzo Ulug''bek tumanida.', 'tamirlash', 150000, 'Mirzo Ulug''bek', 1.1, now() - interval '1 hour'),
('Chorsu bozoridan milliy shirinliklar', 'Mehmonlar kelishi munosabati bilan chak-chak, novvot va boshqa shirinliklar olib kelish kerak.', 'xarid', 35000, 'Chorsu bozori', 3.8, now() - interval '2 hours'),
('Printer drayverini o''rnatish va sozlash', 'Onlayn ish uchun printer kompyuterga ulanmayapti, tez yordam kerak. Yakkasaroy tumani.', 'raqamli', 80000, 'Yakkasaroy tumani', 0.9, now() - interval '30 minutes'),
('Uy bosh tozalash — 3 xonali', '3 xonali kvartira bosh tozalash. Barcha zarur tozalash vositalari buyurtmachi tomonidan beriladi.', 'tozalash', 120000, 'Chilonzor tumani', 1.6, now() - interval '4 hours'),
('Hovlidagi xazonlarni tozalash', 'Katta hovlidagi xazonlarni yig''ib, qoplarga joylash va olib ketish kerak. 2-3 soatlik ish.', 'tozalash', 250000, 'Yunusobod tumani', 0.5, now() - interval '3 hours');
