const SUPABASE_URL = 'https://sqfxrscrgtgkxkoxlhus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O6TfKTFOpHoyjb6Dp1vNuA_45eezuM-';

const _supabase = typeof supabase !== 'undefined'
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const ROLE = {
    employer: 'employer',
    helper: 'helper',
    poster: 'employer'
};

const ROLE_HOME = {
    employer: 'poster.html',
    helper: 'vazifa.html'
};

const PAGE_ACCESS = {
    employer: ['poster.html', 'mahallam.html', 'map.html', 'profil.html', 'bildirishnoma.html', 'chatlar.html', 'kuzatish.html', 'baholash.html', 'muammo.html', 'yordam.html', 'index.html'],
    helper: ['vazifa.html', 'helper.html', 'daromad.html', 'mahallam.html', 'map.html', 'profil.html', 'bildirishnoma.html', 'chatlar.html', 'kuzatish.html', 'baholash.html', 'muammo.html', 'yordam.html', 'index.html']
};

const LANG_META = {
    uz: { label: "O'zbek", native: "O'zbek tili", flag: '🇺🇿' },
    ru: { label: 'Русский', native: 'Rus tili', flag: '🇷🇺' },
    en: { label: 'English', native: 'Ingliz tili', flag: '🇬🇧' }
};

const I18N = {
    uz: {
        'nav.mahallam': 'Mahallam',
        'nav.jobs': 'Ishlar',
        'nav.postJob': 'E\'lon berish',
        'nav.helpers': 'Yordamchilar',
        'nav.chat': 'Chat',
        'nav.notifications': 'Bildirishnomalar',
        'nav.profile': 'Profil',
        'nav.login': 'Kirish',
        'nav.register': 'Ro\'yxatdan o\'tish',
        'nav.logout': 'Chiqish',
        'role.employer': 'Ish beruvchi',
        'role.helper': 'Yordamchi',
        'common.loading': 'Yuklanmoqda...',
        'chat.empty': 'Suhbatni tanlang',
        'chat.type': 'Xabar yozing...',
        'chat.noChats': 'Hali suhbatlar yo\'q.',
        'chat.online': 'Online'
    },
    ru: {
        'nav.mahallam': 'Махалля',
        'nav.jobs': 'Работы',
        'nav.postJob': 'Создать объявление',
        'nav.helpers': 'Помощники',
        'nav.chat': 'Чат',
        'nav.notifications': 'Уведомления',
        'nav.profile': 'Профиль',
        'nav.login': 'Войти',
        'nav.register': 'Регистрация',
        'nav.logout': 'Выйти',
        'role.employer': 'Работодатель',
        'role.helper': 'Помощник',
        'common.loading': 'Загрузка...',
        'chat.empty': 'Выберите чат',
        'chat.type': 'Напишите сообщение...',
        'chat.noChats': 'Чатов пока нет.',
        'chat.online': 'Онлайн'
    },
    en: {
        'nav.mahallam': 'Community',
        'nav.jobs': 'Jobs',
        'nav.postJob': 'Post job',
        'nav.helpers': 'Helpers',
        'nav.chat': 'Chat',
        'nav.notifications': 'Notifications',
        'nav.profile': 'Profile',
        'nav.login': 'Log in',
        'nav.register': 'Register',
        'nav.logout': 'Log out',
        'role.employer': 'Employer',
        'role.helper': 'Helper',
        'common.loading': 'Loading...',
        'chat.empty': 'Choose a chat',
        'chat.type': 'Write a message...',
        'chat.noChats': 'No chats yet.',
        'chat.online': 'Online'
    }
};

const COMMON_I18N = {
    uz: {
        'nav.yordam': 'Yordam',
        'footer.desc': 'O\'zbekistondagi mahalliy yordam va topshiriqlar uchun eng ishonchli hamjamiyat. Qo\'shnilar bir-biriga yordam beradi.',
        'footer.company': 'Kompaniya',
        'footer.about': 'Biz haqimizda',
        'footer.how': 'Qanday ishlaydi',
        'footer.categories': 'Kategoriyalar',
        'footer.blog': 'Blog',
        'footer.help_title': 'Yordam',
        'footer.help_center': 'Yordam markazi',
        'footer.terms': 'Foydalanish shartlari',
        'footer.privacy': 'Maxfiylik siyosati',
        'footer.contacts': 'Kontaktlar',
        'footer.safety': 'Xavfsizlik',
        'footer.rules': 'Qoidalar',
        'footer.copyright': '© 2026 Topshiriq.uz. Barcha huquqlar himoyalangan.'
    },
    ru: {
        'nav.yordam': 'Помощь',
        'footer.desc': 'Надежное сообщество для местной помощи и задач в Узбекистане. Соседи помогают друг другу.',
        'footer.company': 'Компания',
        'footer.about': 'О нас',
        'footer.how': 'Как это работает',
        'footer.categories': 'Категории',
        'footer.blog': 'Блог',
        'footer.help_title': 'Помощь',
        'footer.help_center': 'Центр помощи',
        'footer.terms': 'Условия использования',
        'footer.privacy': 'Политика конфиденциальности',
        'footer.contacts': 'Контакты',
        'footer.safety': 'Безопасность',
        'footer.rules': 'Правила',
        'footer.copyright': '© 2026 Topshiriq.uz. Все права защищены.'
    },
    en: {
        'nav.yordam': 'Help',
        'footer.desc': 'The most trusted community for local help and tasks in Uzbekistan. Neighbors help each other.',
        'footer.company': 'Company',
        'footer.about': 'About us',
        'footer.how': 'How it works',
        'footer.categories': 'Categories',
        'footer.blog': 'Blog',
        'footer.help_title': 'Support',
        'footer.help_center': 'Help center',
        'footer.terms': 'Terms of service',
        'footer.privacy': 'Privacy policy',
        'footer.contacts': 'Contacts',
        'footer.safety': 'Safety',
        'footer.rules': 'Rules',
        'footer.copyright': '© 2026 Topshiriq.uz. All rights reserved.'
    }
};

const PHRASE_I18N = {
    'Biz haqimizda': { uz: 'Biz haqimizda', ru: 'О нас', en: 'About us' },
    'Xavfsizlik': { uz: 'Xavfsizlik', ru: 'Безопасность', en: 'Safety' },
    'Qoidalar': { uz: 'Qoidalar', ru: 'Правила', en: 'Rules' },
    'Bog\'lanish': { uz: 'Bog\'lanish', ru: 'Связаться', en: 'Contact' },
    'Yordam': { uz: 'Yordam', ru: 'Помощь', en: 'Help' },
    'Yordam markazi': { uz: 'Yordam markazi', ru: 'Центр помощи', en: 'Help center' },
    'Foydalanish shartlari': { uz: 'Foydalanish shartlari', ru: 'Условия использования', en: 'Terms of service' },
    'Maxfiylik siyosati': { uz: 'Maxfiylik siyosati', ru: 'Политика конфиденциальности', en: 'Privacy policy' },
    'Kontaktlar': { uz: 'Kontaktlar', ru: 'Контакты', en: 'Contacts' },
    'Kompaniya': { uz: 'Kompaniya', ru: 'Компания', en: 'Company' },
    'Blog': { uz: 'Blog', ru: 'Блог', en: 'Blog' },
    'Vakansiyalar': { uz: 'Vakansiyalar', ru: 'Вакансии', en: 'Careers' },

    'Bildirishnomalar': { uz: 'Bildirishnomalar', ru: 'Уведомления', en: 'Notifications' },
    'Barchasi': { uz: 'Barchasi', ru: 'Все', en: 'All' },
    'Topshiriqlar': { uz: 'Topshiriqlar', ru: 'Задания', en: 'Tasks' },
    'To\'lov': { uz: 'To\'lov', ru: 'Оплата', en: 'Payment' },
    'Tizim': { uz: 'Tizim', ru: 'Система', en: 'System' },
    'Xabarlar': { uz: 'Xabarlar', ru: 'Сообщения', en: 'Messages' },
    'Suhbatlar': { uz: 'Suhbatlar', ru: 'Чаты', en: 'Chats' },
    'Suhbatni tanlang': { uz: 'Suhbatni tanlang', ru: 'Выберите чат', en: 'Choose a chat' },
    'Chap tomondan suhbatni tanlang yoki yangi topshiriq bering.': { uz: 'Chap tomondan suhbatni tanlang yoki yangi topshiriq bering.', ru: 'Выберите чат слева или создайте новое задание.', en: 'Choose a chat on the left or create a new task.' },
    'Xabar yozing...': { uz: 'Xabar yozing...', ru: 'Напишите сообщение...', en: 'Write a message...' },
    'Topshiriq holati:': { uz: 'Topshiriq holati:', ru: 'Статус задания:', en: 'Task status:' },
    'Budjet': { uz: 'Budjet', ru: 'Бюджет', en: 'Budget' },
    'Tugatish': { uz: 'Tugatish', ru: 'Завершить', en: 'Complete' },
    'Qidirish...': { uz: 'Qidirish...', ru: 'Поиск...', en: 'Search...' },

    'Xush kelibsiz!': { uz: 'Xush kelibsiz!', ru: 'Добро пожаловать!', en: 'Welcome!' },
    'Bugungi daromad:': { uz: 'Bugungi daromad:', ru: 'Доход сегодня:', en: 'Today\'s income:' },
    'Hisobotni ko\'rish': { uz: 'Hisobotni ko\'rish', ru: 'Посмотреть отчет', en: 'View report' },
    'Kunlik statistikangiz': { uz: 'Kunlik statistikangiz', ru: 'Ваша дневная статистика', en: 'Your daily stats' },
    'Bajarildi': { uz: 'Bajarildi', ru: 'Выполнено', en: 'Completed' },
    'Bekor qilingan': { uz: 'Bekor qilingan', ru: 'Отменено', en: 'Cancelled' },
    'Reyting': { uz: 'Reyting', ru: 'Рейтинг', en: 'Rating' },
    'Holat': { uz: 'Holat', ru: 'Статус', en: 'Status' },
    'Atrofingizda': { uz: 'Atrofingizda', ru: 'Рядом с вами', en: 'Near you' },
    'Xaritani ochish': { uz: 'Xaritani ochish', ru: 'Открыть карту', en: 'Open map' },
    'Tezkor topshiriqlar': { uz: 'Tezkor topshiriqlar', ru: 'Срочные задания', en: 'Urgent tasks' },
    'Barcha takliflarni ko\'rish': { uz: 'Barcha takliflarni ko\'rish', ru: 'Посмотреть все предложения', en: 'View all offers' },

    'Tavsif': { uz: 'Tavsif', ru: 'Описание', en: 'Description' },
    'Men haqimda': { uz: 'Men haqimda', ru: 'Обо мне', en: 'About me' },
    'Faoliyat ko\'rsatkichlari': { uz: 'Faoliyat ko\'rsatkichlari', ru: 'Показатели активности', en: 'Performance metrics' },
    'Topshiriqlarni bajarganlar': { uz: 'Topshiriqlarni bajarganlar', ru: 'Исполнители заданий', en: 'Task performers' },
    'Hamyon va Balans': { uz: 'Hamyon va Balans', ru: 'Кошелек и баланс', en: 'Wallet and balance' },
    'Joriy hisob balansi': { uz: 'Joriy hisob balansi', ru: 'Текущий баланс', en: 'Current balance' },
    'Xavfsiz tranzaksiya': { uz: 'Xavfsiz tranzaksiya', ru: 'Безопасная транзакция', en: 'Secure transaction' },
    'FAOL': { uz: 'FAOL', ru: 'АКТИВНО', en: 'ACTIVE' },
    'Karta ulangan: 8600 **** **** 4321': { uz: 'Karta ulangan: 8600 **** **** 4321', ru: 'Карта подключена: 8600 **** **** 4321', en: 'Card linked: 8600 **** **** 4321' },
    'Mablag\'lar kafolatlangan': { uz: 'Mablag\'lar kafolatlangan', ru: 'Средства защищены', en: 'Funds are guaranteed' },
    'Yakunlangan': { uz: 'Yakunlangan', ru: 'Завершено', en: 'Completed' },
    'Tizim bo\'limlari': { uz: 'Tizim bo\'limlari', ru: 'Разделы системы', en: 'System sections' },
    'Admin Boshqaruvi': { uz: 'Admin Boshqaruvi', ru: 'Админ-панель', en: 'Admin panel' },
    'Moderatsiya Markazi': { uz: 'Moderatsiya Markazi', ru: 'Центр модерации', en: 'Moderation center' },
    'Shaxs tasdiqlangan': { uz: 'Shaxs tasdiqlangan', ru: 'Личность подтверждена', en: 'Identity verified' },
    'Pasport va raqam tekshirilgan': { uz: 'Pasport va raqam tekshirilgan', ru: 'Паспорт и номер проверены', en: 'Passport and phone verified' },
    'Tahrirlash': { uz: 'Tahrirlash', ru: 'Редактировать', en: 'Edit' },
    'Chiqish': { uz: 'Chiqish', ru: 'Выйти', en: 'Log out' },
    'Profilni tahrirlash': { uz: 'Profilni tahrirlash', ru: 'Редактировать профиль', en: 'Edit profile' },
    'Ma\'lumotlaringizni yangilang': { uz: 'Ma\'lumotlaringizni yangilang', ru: 'Обновите ваши данные', en: 'Update your details' },
    'Ism': { uz: 'Ism', ru: 'Имя', en: 'First name' },
    'Familiya': { uz: 'Familiya', ru: 'Фамилия', en: 'Last name' },
    'Email manzil': { uz: 'Email manzil', ru: 'Email адрес', en: 'Email address' },
    'Telefon raqam': { uz: 'Telefon raqam', ru: 'Телефон', en: 'Phone number' },
    'Tuman': { uz: 'Tuman', ru: 'Район', en: 'District' },
    'Parol': { uz: 'Parol', ru: 'Пароль', en: 'Password' },
    'Saqlash': { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
    'Bekor qilish': { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },

    'Faol vazifalar': { uz: 'Faol vazifalar', ru: 'Активные задания', en: 'Active jobs' },
    'Filtrlar': { uz: 'Filtrlar', ru: 'Фильтры', en: 'Filters' },
    'Tozalash': { uz: 'Tozalash', ru: 'Очистить', en: 'Clear' },
    'Kategoriyalar': { uz: 'Kategoriyalar', ru: 'Категории', en: 'Categories' },
    'Xarid qilish': { uz: 'Xarid qilish', ru: 'Покупки', en: 'Shopping' },
    'Ta\'mirlash': { uz: 'Ta\'mirlash', ru: 'Ремонт', en: 'Repair' },
    'Yetkazib berish': { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' },
    'Raqamli yordam': { uz: 'Raqamli yordam', ru: 'Цифровая помощь', en: 'Digital help' },
    'Boshqa': { uz: 'Boshqa', ru: 'Другое', en: 'Other' },
    'Saralash:': { uz: 'Saralash:', ru: 'Сортировка:', en: 'Sort:' },
    'Eng yangilari': { uz: 'Eng yangilari', ru: 'Сначала новые', en: 'Newest' },
    'Narx bo\'yicha': { uz: 'Narx bo\'yicha', ru: 'По цене', en: 'By price' },
    'Reyting bo\'yicha': { uz: 'Reyting bo\'yicha', ru: 'По рейтингу', en: 'By rating' },
    'Masofaga ko\'ra': { uz: 'Masofaga ko\'ra', ru: 'По расстоянию', en: 'By distance' },
    'Topshiriq qidiring...': { uz: 'Topshiriq qidiring...', ru: 'Найти задание...', en: 'Search jobs...' },

    'Hisob yarating': { uz: 'Hisob yarating', ru: 'Создайте аккаунт', en: 'Create account' },
    'Bir daqiqada ro\'yxatdan o\'ting va boshlang.': { uz: 'Bir daqiqada ro\'yxatdan o\'ting va boshlang.', ru: 'Зарегистрируйтесь за минуту и начните.', en: 'Register in a minute and get started.' },
    'Ish beruvchi': { uz: 'Ish beruvchi', ru: 'Работодатель', en: 'Employer' },
    'Yordamchi (Ijrochi)': { uz: 'Yordamchi (Ijrochi)', ru: 'Помощник', en: 'Helper' },
    'Ro\'yxatdan o\'tish': { uz: 'Ro\'yxatdan o\'tish', ru: 'Зарегистрироваться', en: 'Register' },
    'Kirish': { uz: 'Kirish', ru: 'Войти', en: 'Log in' },
    'Xush kelibsiz!': { uz: 'Xush kelibsiz!', ru: 'Добро пожаловать!', en: 'Welcome!' },
    'Davom etish uchun tizimga kiring.': { uz: 'Davom etish uchun tizimga kiring.', ru: 'Войдите, чтобы продолжить.', en: 'Log in to continue.' },

    'Salom!': { uz: 'Salom!', ru: 'Здравствуйте!', en: 'Hello!' },
    '18 ta faol yordamchi yaqiningizda yordamga tayyor.': { uz: '18 ta faol yordamchi yaqiningizda yordamga tayyor.', ru: '18 активных помощников рядом готовы помочь.', en: '18 active helpers nearby are ready to help.' },
    'Yangi topshiriq': { uz: 'Yangi topshiriq', ru: 'Новое задание', en: 'New task' },
    'Tezkor yordam': { uz: 'Tezkor yordam', ru: 'Быстрая помощь', en: 'Quick help' },
    'Hammasi': { uz: 'Hammasi', ru: 'Все', en: 'All' },
    'Bozorlik': { uz: 'Bozorlik', ru: 'Покупки', en: 'Groceries' },
    'Dorixona': { uz: 'Dorixona', ru: 'Аптека', en: 'Pharmacy' },
    'Usta': { uz: 'Usta', ru: 'Мастер', en: 'Handyman' },
    'Yuk tashish': { uz: 'Yuk tashish', ru: 'Перевозка', en: 'Moving' },
    'Mening topshiriqlarim': { uz: 'Mening topshiriqlarim', ru: 'Мои задания', en: 'My tasks' },
    '2 faol': { uz: '2 faol', ru: '2 активных', en: '2 active' },
    'Dorixonadan dori': { uz: 'Dorixonadan dori', ru: 'Лекарство из аптеки', en: 'Medicine from pharmacy' },
    'Yaqin atrofdagi OXYmed dan': { uz: 'Yaqin atrofdagi OXYmed dan', ru: 'Из ближайшего OXYmed', en: 'From nearby OXYmed' },
    'Suhbat': { uz: 'Suhbat', ru: 'Чат', en: 'Chat' },
    'Bajarildi deb belgilash': { uz: 'Bajarildi deb belgilash', ru: 'Отметить выполненным', en: 'Mark completed' },
    'Bozordan xarid': { uz: 'Bozordan xarid', ru: 'Покупки с базара', en: 'Market shopping' },
    'Moy va un (5kg)': { uz: 'Moy va un (5kg)', ru: 'Масло и мука (5 кг)', en: 'Oil and flour (5kg)' },
    'kutilmoqda': { uz: 'kutilmoqda', ru: 'ожидается', en: 'pending' },
    'Yordamchilar': { uz: 'Yordamchilar', ru: 'Помощники', en: 'Helpers' },
    'Topshiriq sarlavhasi': { uz: 'Topshiriq sarlavhasi', ru: 'Название задания', en: 'Task title' },
    'Kategoriya': { uz: 'Kategoriya', ru: 'Категория', en: 'Category' },
    'Batafsil tavsif': { uz: 'Batafsil tavsif', ru: 'Подробное описание', en: 'Detailed description' },
    'Budjet (so\'m)': { uz: 'Budjet (so\'m)', ru: 'Бюджет (сум)', en: 'Budget (UZS)' },
    'E\'lon qilish': { uz: 'E\'lon qilish', ru: 'Опубликовать', en: 'Publish' },

    'Yechib olish uchun mavjud': { uz: 'Yechib olish uchun mavjud', ru: 'Доступно для вывода', en: 'Available to withdraw' },
    'Pul yechib olish': { uz: 'Pul yechib olish', ru: 'Вывести деньги', en: 'Withdraw' },
    'Haftalik daromad': { uz: 'Haftalik daromad', ru: 'Недельный доход', en: 'Weekly income' },
    'Oxirgi 7 kun': { uz: 'Oxirgi 7 kun', ru: 'Последние 7 дней', en: 'Last 7 days' },
    'Tranzaksiyalar tarixi': { uz: 'Tranzaksiyalar tarixi', ru: 'История транзакций', en: 'Transaction history' },
    'Yuklanmoqda...': { uz: 'Yuklanmoqda...', ru: 'Загрузка...', en: 'Loading...' },
    'Do\'stingizni taklif qiling': { uz: 'Do\'stingizni taklif qiling', ru: 'Пригласите друга', en: 'Invite a friend' },
    'Har bir yangi ro\'yxatdan o\'tgan do\'stingiz uchun 50,000 so\'m bonusga ega bo\'ling.': { uz: 'Har bir yangi ro\'yxatdan o\'tgan do\'stingiz uchun 50,000 so\'m bonusga ega bo\'ling.', ru: 'Получайте бонус 50 000 сум за каждого нового друга.', en: 'Get a 50,000 UZS bonus for every new registered friend.' },
    'Nusxalash': { uz: 'Nusxalash', ru: 'Копировать', en: 'Copy' },
    'Mahalla Qahramoni': { uz: 'Mahalla Qahramoni', ru: 'Герой махалли', en: 'Community hero' },
    'Har bir bajarilgan topshiriq sizni "Oltin" statusiga yaqinlashtiradi.': { uz: 'Har bir bajarilgan topshiriq sizni "Oltin" statusiga yaqinlashtiradi.', ru: 'Каждое выполненное задание приближает вас к статусу "Золото".', en: 'Every completed task brings you closer to Gold status.' },
    'Yordam kerakmi?': { uz: 'Yordam kerakmi?', ru: 'Нужна помощь?', en: 'Need help?' },
    'Pul yechish yoki daromadlar bo\'yicha savollaringiz bo\'lsa, biz bilan bog\'laning.': { uz: 'Pul yechish yoki daromadlar bo\'yicha savollaringiz bo\'lsa, biz bilan bog\'laning.', ru: 'Если есть вопросы по выводу средств или доходам, свяжитесь с нами.', en: 'Contact us if you have questions about withdrawals or earnings.' },
    'Qo\'llab-quvvatlash xizmati →': { uz: 'Qo\'llab-quvvatlash xizmati →', ru: 'Служба поддержки →', en: 'Support service →' },

    'Yordam mavzulari': { uz: 'Yordam mavzulari', ru: 'Темы помощи', en: 'Help topics' },
    'Hisob yaratish va sozlash bo\'yicha qo\'llanma': { uz: 'Hisob yaratish va sozlash bo\'yicha qo\'llanma', ru: 'Руководство по созданию и настройке аккаунта', en: 'Guide to creating and setting up an account' },
    'Topshiriq berish': { uz: 'Topshiriq berish', ru: 'Создать задание', en: 'Post a task' },
    'Topshiriq qanday yaratiladi va boshqariladi': { uz: 'Topshiriq qanday yaratiladi va boshqariladi', ru: 'Как создавать задания и управлять ими', en: 'How tasks are created and managed' },
    'To\'lov va daromad': { uz: 'To\'lov va daromad', ru: 'Оплата и доход', en: 'Payment and earnings' },
    'To\'lov usullari, escrow va pul yechib olish': { uz: 'To\'lov usullari, escrow va pul yechib olish', ru: 'Способы оплаты, escrow и вывод средств', en: 'Payment methods, escrow, and withdrawals' },
    'ID tasdiqash va xavfsiz hamkorlik qoidalari': { uz: 'ID tasdiqash va xavfsiz hamkorlik qoidalari', ru: 'Проверка ID и правила безопасного сотрудничества', en: 'ID verification and safe cooperation rules' },
    'Reyting tizimi': { uz: 'Reyting tizimi', ru: 'Система рейтинга', en: 'Rating system' },
    'Baholar qanday hisoblanadi va nima uchun muhim': { uz: 'Baholar qanday hisoblanadi va nima uchun muhim', ru: 'Как считаются оценки и почему они важны', en: 'How ratings are calculated and why they matter' },
    'Nizolar va shikoyatlar': { uz: 'Nizolar va shikoyatlar', ru: 'Споры и жалобы', en: 'Disputes and complaints' },
    'Muammolarni hal qilish va moderatsiya jarayoni': { uz: 'Muammolarni hal qilish va moderatsiya jarayoni', ru: 'Решение проблем и процесс модерации', en: 'Problem solving and moderation process' },
    'Ko\'p so\'raladigan savollar': { uz: 'Ko\'p so\'raladigan savollar', ru: 'Часто задаваемые вопросы', en: 'Frequently asked questions' },
    'Hali ham savol bormi?': { uz: 'Hali ham savol bormi?', ru: 'Остались вопросы?', en: 'Still have questions?' },
    'Bizning jamoamiz 24/7 sizga yordam berishga tayyor.': { uz: 'Bizning jamoamiz 24/7 sizga yordam berishga tayyor.', ru: 'Наша команда готова помочь вам 24/7.', en: 'Our team is ready to help you 24/7.' }
};

const headerLink = document.createElement('link');
headerLink.rel = 'stylesheet';
headerLink.href = 'header.css';
document.head.appendChild(headerLink);

function normalizeRole(role) {
    return ROLE[role] || ROLE.helper;
}

function t(key) {
    const lang = getCurrentLanguage();
    const globalTrans = window.translations || (typeof translations !== 'undefined' ? translations : null);
    if (globalTrans && globalTrans[lang] && globalTrans[lang][key] !== undefined) {
        return globalTrans[lang][key];
    }
    return (I18N[lang] && I18N[lang][key])
        || (COMMON_I18N[lang] && COMMON_I18N[lang][key])
        || (I18N.uz && I18N.uz[key])
        || (COMMON_I18N.uz && COMMON_I18N.uz[key])
        || key;
}

function normalizePhrase(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function phraseToKey(value) {
    const normalized = normalizePhrase(value);
    if (!normalized) return null;

    for (const [key, translations] of Object.entries(PHRASE_I18N)) {
        if (normalizePhrase(key) === normalized) return key;
        if (Object.values(translations).some(text => normalizePhrase(text) === normalized)) return key;
    }

    return null;
}

function translatePhrase(value, lang = getCurrentLanguage()) {
    const key = phraseToKey(value);
    if (!key) return value;
    return PHRASE_I18N[key][lang] || PHRASE_I18N[key].uz || value;
}

function getCurrentLanguage() {
    return localStorage.getItem('appLanguage') || localStorage.getItem('topshiriq_lang') || 'uz';
}

async function setCurrentLanguage(lang) {
    const nextLang = ['uz', 'ru', 'en'].includes(lang) ? lang : 'uz';
    localStorage.setItem('appLanguage', nextLang);
    localStorage.setItem('topshiriq_lang', nextLang);
    document.documentElement.lang = nextLang;
    applyI18n();

    const user = getCurrentUser();
    if (user && _supabase) {
        await _supabase.from('profiles').update({ preferred_language: nextLang }).eq('id', user.id);
        saveCurrentUser({ ...user, preferred_language: nextLang });
    }
}

function applyI18n(root = document) {
    const lang = getCurrentLanguage();
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    translateStaticPhrases(root, lang);
}

function translateStaticPhrases(root = document, lang = getCurrentLanguage()) {
    const scope = root.nodeType === Node.DOCUMENT_NODE ? root.body : root;
    if (!scope) return;

    scope.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        if (!el.dataset.i18nPlaceholder) el.placeholder = translatePhrase(el.placeholder, lang);
    });
    scope.querySelectorAll('[title]').forEach(el => {
        if (!el.dataset.i18nTitle) el.title = translatePhrase(el.title, lang);
    });
    scope.querySelectorAll('[aria-label]').forEach(el => {
        el.setAttribute('aria-label', translatePhrase(el.getAttribute('aria-label'), lang));
    });

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (parent.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
            if (parent.dataset && parent.dataset.i18n) return NodeFilter.FILTER_REJECT;
            return normalizePhrase(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
        const original = node.nodeValue;
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        const translated = translatePhrase(original, lang);
        if (translated !== original) node.nodeValue = `${leading}${translated}${trailing}`;
    });
}

let i18nObserver = null;
let i18nObserverTimer = null;

function startI18nObserver() {
    if (i18nObserver || !document.body || typeof MutationObserver === 'undefined') return;

    i18nObserver = new MutationObserver(mutations => {
        const shouldTranslate = mutations.some(mutation => {
            if (mutation.type === 'characterData') return normalizePhrase(mutation.target.nodeValue);
            return Array.from(mutation.addedNodes || []).some(node => {
                if (node.nodeType === Node.TEXT_NODE) return normalizePhrase(node.nodeValue);
                if (node.nodeType !== Node.ELEMENT_NODE) return false;
                return !node.matches('script, style, noscript') && normalizePhrase(node.textContent);
            });
        });

        if (!shouldTranslate) return;
        clearTimeout(i18nObserverTimer);
        i18nObserverTimer = setTimeout(() => translateStaticPhrases(document), 40);
    });

    i18nObserver.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed ? { ...parsed, role: normalizeRole(parsed.role) } : null;
    } catch (_) {
        return null;
    }
}

function saveCurrentUser(profile) {
    if (!profile) {
        localStorage.removeItem('currentUser');
        return;
    }

    const normalized = {
        ...profile,
        role: normalizeRole(profile.role),
        preferred_language: profile.preferred_language || getCurrentLanguage()
    };
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    refreshGlobalAvatars(normalized);
}

function getUserFullName(user) {
    if (!user) return 'Foydalanuvchi';
    if (user.full_name) return user.full_name;
    const first = user.first_name || user.firstName || '';
    const last = user.last_name || user.lastName || '';
    if (first || last) return `${first} ${last}`.trim();
    return user.email ? user.email.split('@')[0] : 'Foydalanuvchi';
}

function getUserInitials(user) {
    const name = getUserFullName(user);
    return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function escapeAttr(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function renderAvatarMarkup(user, className = 'avatar-nav') {
    const initials = getUserInitials(user);
    const avatarUrl = user?.avatar_url;
    if (avatarUrl) {
        return `<span class="${className} has-avatar-photo" data-global-avatar="true" style="--avatar-image:url('${escapeAttr(avatarUrl)}')" aria-label="${escapeAttr(getUserFullName(user))}"></span>`;
    }
    return `<span class="${className}" data-global-avatar="true" aria-label="${escapeAttr(getUserFullName(user))}">${initials}</span>`;
}

function refreshGlobalAvatars(user = getCurrentUser()) {
    if (!user) return;
    document.querySelectorAll('.avatar-nav, .avatar, .header-avatar, [data-global-avatar="true"], .drawer-user-profile .avatar-nav').forEach(el => {
        el.classList.toggle('has-avatar-photo', Boolean(user.avatar_url));
        if (user.avatar_url) {
            el.style.setProperty('--avatar-image', `url('${user.avatar_url}')`);
            el.style.setProperty('background-image', `url('${user.avatar_url}')`, 'important');
        } else {
            el.style.removeProperty('--avatar-image');
            el.style.removeProperty('background-image');
        }
        el.textContent = user.avatar_url ? '' : getUserInitials(user);
        el.setAttribute('aria-label', getUserFullName(user));
        el.setAttribute('data-global-avatar', 'true');
    });
}

function splitFullName(fullName = '') {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ')
    };
}

function buildProfile(authUser, profile = {}) {
    const meta = authUser?.user_metadata || {};
    const fullName = profile.full_name || meta.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return {
        id: profile.id || authUser?.id,
        email: authUser?.email || profile.email || '',
        full_name: fullName || '',
        ...splitFullName(fullName),
        phone: profile.phone || meta.phone || '',
        city: profile.city || profile.district || meta.city || '',
        district: profile.city || profile.district || meta.city || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        role: normalizeRole(profile.role || meta.role),
        notifications_enabled: profile.notifications_enabled !== false,
        preferred_language: profile.preferred_language || meta.preferred_language || getCurrentLanguage()
    };
}

async function fetchProfile(userId, authUser = null) {
    if (!_supabase || !userId) return null;
    let { data, error } = await _supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data && authUser?.email) {
        const byEmail = await _supabase.from('profiles').select('*').eq('email', authUser.email).maybeSingle();
        if (byEmail.error) throw byEmail.error;
        data = byEmail.data;
    }
    return buildProfile(authUser, data || {});
}

function getRoleHome(role) {
    return ROLE_HOME[normalizeRole(role)] || ROLE_HOME.helper;
}

function currentPageName() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

async function requireAuth(expectedRole = null) {
    let user = getCurrentUser();

    if (!user && _supabase) {
        const { data } = await _supabase.auth.getUser();
        if (data?.user) {
            user = await fetchProfile(data.user.id, data.user);
            saveCurrentUser(user);
        }
    }

    if (!user) {
        window.location.href = 'kirish.html';
        return null;
    }

    if (expectedRole && user.role !== normalizeRole(expectedRole)) {
        window.location.href = getRoleHome(user.role);
        return null;
    }

    const page = currentPageName();
    const allowed = PAGE_ACCESS[user.role] || [];
    if (page !== 'onboarding.html' && allowed.length && !allowed.includes(page)) {
        window.location.href = getRoleHome(user.role);
        return null;
    }

    return user;
}

async function logoutUser() {
    saveCurrentUser(null);
    if (_supabase) await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

async function updateProfileSettings(updates) {
    const user = getCurrentUser();
    if (!user) return null;

    const next = { ...user, ...updates };
    saveCurrentUser(next);

    if (_supabase) {
        const payload = {
            first_name: next.first_name || null,
            last_name: next.last_name || null,
            full_name: next.full_name || getUserFullName(next),
            phone: next.phone || null,
            district: next.district || next.city || null,
            address: next.address || null,
            bio: next.bio || null,
            avatar_url: next.avatar_url || null,
            notifications_enabled: next.notifications_enabled !== false,
            preferred_language: next.preferred_language || getCurrentLanguage()
        };
        await _supabase.from('profiles').update(payload).eq('id', user.id);
    }

    window.dispatchEvent(new CustomEvent('profile:updated', { detail: next }));
    return next;
}

async function openChatWith(otherUserId, jobId = null) {
    const me = getCurrentUser();
    if (!me) {
        window.location.href = 'kirish.html';
        return;
    }
    if (!otherUserId || otherUserId === me.id) return;
    sessionStorage.setItem('chatPeerId', otherUserId);
    if (jobId) sessionStorage.setItem('chatJobId', jobId);
    window.location.href = 'chatlar.html';
}

function renderUnifiedHeader(user = getCurrentUser()) {
    const existing = document.querySelector('header.navbar, body > .navbar, body > nav, header, .main-nav-header');
    if (!existing) return;

    const role = normalizeRole(user?.role);
    const lang = getCurrentLanguage();
    const roleNav = role === 'employer'
        ? `<a href="poster.html" data-i18n="nav.postJob">${t('nav.postJob')}</a><a href="mahallam.html" data-i18n="nav.helpers">${t('nav.helpers')}</a>`
        : `<a href="vazifa.html" data-i18n="nav.jobs">${t('nav.jobs')}</a><a href="helper.html" data-i18n="role.helper">${t('role.helper')}</a>`;

    existing.className = 'navbar';
    existing.innerHTML = `
        <div class="nav-container">
            <a href="index.html" class="logo">
                <span class="logo-icon"><i class="fas fa-handshake"></i></span> Topshiriq.uz
            </a>
            <nav class="nav-menu">
                <a href="mahallam.html" data-i18n="nav.mahallam">${t('nav.mahallam')}</a>
                ${user ? roleNav : `<a href="vazifa.html" data-i18n="nav.jobs">${t('nav.jobs')}</a>`}
                <a href="chatlar.html" data-i18n="nav.chat">${t('nav.chat')}</a>
                <a href="yordam.html" data-i18n="nav.yordam">${t('nav.yordam')}</a>
            </nav>
            <div class="nav-actions">
                ${renderLangSwitcherMarkup(lang)}
                ${user ? `
                    <a href="bildirishnoma.html" class="notification-link" aria-label="${t('nav.notifications')}"><i class="far fa-bell"></i></a>
                    <a href="profil.html" class="avatar-link" title="${t('nav.profile')}">${renderAvatarMarkup(user, 'avatar-nav')}<span class="sr-only">${t('nav.profile')}</span></a>
                ` : `
                    <a href="kirish.html" class="btn-login" data-i18n="nav.login">${t('nav.login')}</a>
                    <a href="register.html" class="btn-primary" data-i18n="nav.register">${t('nav.register')}</a>
                `}
                <button class="hamburger-btn" id="hamburgerBtn" type="button" aria-label="Menyu">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    `;

    const path = currentPageName();
    existing.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
    });

    wireLangSwitcher(existing.querySelector('.lang-switcher'), user);
    existing.querySelector('#hamburgerBtn')?.addEventListener('click', openMobileDrawer);
    applyI18n(existing);

    renderMobileDrawer(user, role, roleNav);
}

function renderLangSwitcherMarkup(lang) {
    const meta = LANG_META[lang] || LANG_META.uz;
    const options = Object.keys(LANG_META).map(code => `
        <div class="lang-option ${code === lang ? 'active' : ''}" data-lang="${code}" role="option" aria-selected="${code === lang}">
            <span class="lang-option-flag">${LANG_META[code].flag}</span>
            <div class="lang-option-info">
                <span class="lang-option-label">${LANG_META[code].label}</span>
                <span class="lang-option-native">${LANG_META[code].native}</span>
            </div>
            <span class="lang-option-check"><i class="fas fa-check"></i></span>
        </div>
    `).join('');

    return `
        <div class="lang-switcher" id="langSwitcher">
            <button type="button" class="lang-trigger" id="langTrigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Tilni tanlash">
                <span class="lang-selected-flag">${meta.flag}</span>
                <span class="lang-selected-label">${meta.label}</span>
                <i class="fas fa-chevron-down lang-chevron"></i>
            </button>
            <div class="lang-dropdown" role="listbox">
                <div class="lang-dropdown-header">Tilni tanlang</div>
                ${options}
            </div>
        </div>
    `;
}

function wireLangSwitcher(wrapper, user) {
    if (!wrapper) return;
    const trigger = wrapper.querySelector('.lang-trigger');

    trigger?.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
    });

    wrapper.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', async e => {
            e.stopPropagation();
            wrapper.classList.remove('open');
            trigger?.setAttribute('aria-expanded', 'false');
            if (opt.dataset.lang === getCurrentLanguage()) return;
            await setCurrentLanguage(opt.dataset.lang);
            renderUnifiedHeader(user);
        });
    });
}

document.addEventListener('click', () => {
    document.querySelector('.lang-switcher.open')?.classList.remove('open');
});

function closeMobileDrawer() {
    document.getElementById('mobileDrawer')?.classList.remove('open');
    document.getElementById('mobileNavBackdrop')?.classList.remove('open');
}

function openMobileDrawer() {
    document.getElementById('mobileDrawer')?.classList.add('open');
    document.getElementById('mobileNavBackdrop')?.classList.add('open');
}

function renderMobileDrawer(user, role) {
    document.getElementById('mobileDrawer')?.remove();
    document.getElementById('mobileNavBackdrop')?.remove();

    const drawerLinks = user
        ? (role === 'employer'
            ? [
                { href: 'mahallam.html', icon: 'fas fa-map-marker-alt', key: 'nav.mahallam' },
                { href: 'poster.html', icon: 'fas fa-plus-circle', key: 'nav.postJob' },
                { href: 'mahallam.html', icon: 'fas fa-users', key: 'nav.helpers' },
                { href: 'chatlar.html', icon: 'fas fa-comment-dots', key: 'nav.chat' },
                { href: 'yordam.html', icon: 'fas fa-life-ring', key: 'nav.yordam' }
            ]
            : [
                { href: 'mahallam.html', icon: 'fas fa-map-marker-alt', key: 'nav.mahallam' },
                { href: 'vazifa.html', icon: 'fas fa-briefcase', key: 'nav.jobs' },
                { href: 'helper.html', icon: 'fas fa-user-check', key: 'role.helper' },
                { href: 'chatlar.html', icon: 'fas fa-comment-dots', key: 'nav.chat' },
                { href: 'yordam.html', icon: 'fas fa-life-ring', key: 'nav.yordam' }
            ])
        : [
            { href: 'mahallam.html', icon: 'fas fa-map-marker-alt', key: 'nav.mahallam' },
            { href: 'vazifa.html', icon: 'fas fa-briefcase', key: 'nav.jobs' },
            { href: 'chatlar.html', icon: 'fas fa-comment-dots', key: 'nav.chat' },
            { href: 'yordam.html', icon: 'fas fa-life-ring', key: 'nav.yordam' }
        ];

    const drawerMenuHtml = drawerLinks.map(link => `
        <a href="${link.href}" class="drawer-menu-link">
            <i class="${link.icon}"></i>
            <span data-i18n="${link.key}">${t(link.key)}</span>
        </a>
    `).join('');

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.id = 'mobileNavBackdrop';
    backdrop.addEventListener('click', closeMobileDrawer);

    const drawer = document.createElement('div');
    drawer.className = 'mobile-drawer';
    drawer.id = 'mobileDrawer';
    drawer.innerHTML = `
        <div class="drawer-header">
            <a href="index.html" class="logo">
                <span class="logo-icon"><i class="fas fa-handshake"></i></span> Topshiriq.uz
            </a>
            <button class="drawer-close-btn" id="drawerCloseBtn" type="button" aria-label="Yopish"><i class="fas fa-times"></i></button>
        </div>
        <nav class="drawer-menu">
            ${drawerMenuHtml}
        </nav>
        <hr class="drawer-divider">
        <div class="drawer-actions">
            ${user ? `
                <button class="logout-btn" type="button" id="drawerLogoutBtn">${t('nav.logout')}</button>
            ` : `
                <a href="kirish.html" class="btn-login" data-i18n="nav.login">${t('nav.login')}</a>
                <a href="register.html" class="btn-primary" data-i18n="nav.register">${t('nav.register')}</a>
            `}
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    drawer.querySelector('#drawerCloseBtn')?.addEventListener('click', closeMobileDrawer);
    drawer.querySelector('#drawerLogoutBtn')?.addEventListener('click', () => {
        closeMobileDrawer();
        logoutUser();
    });
    const path = currentPageName();
    drawer.querySelectorAll('.drawer-menu a').forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileDrawer));
    applyI18n(drawer);
}

function renderUnifiedFooter() {
    const footer = document.querySelector('footer');
    if (!footer || footer.dataset.unifiedFooter === 'true') return;

    footer.dataset.unifiedFooter = 'true';
    footer.className = 'footer unified-footer';
    footer.innerHTML = `
        <div class="unified-footer-inner">
            <div class="unified-footer-brand">
                <a href="index.html" class="unified-footer-logo">
                    <span class="logo-icon"><i class="fas fa-handshake"></i></span>
                    Topshiriq.uz
                </a>
                <p data-i18n="footer.desc">${t('footer.desc')}</p>
                <div class="unified-footer-socials">
                    <a href="yordam.html" aria-label="Website"><i class="fa-solid fa-globe"></i></a>
                    <a href="mahallam.html" aria-label="Community"><i class="fa-solid fa-users"></i></a>
                    <a href="chatlar.html" aria-label="Chat"><i class="fa-regular fa-comments"></i></a>
                </div>
            </div>
            <div class="unified-footer-links">
                <div>
                    <h4 data-i18n="footer.company">${t('footer.company')}</h4>
                    <a href="index.html" data-i18n="footer.about">${t('footer.about')}</a>
                    <a href="index.html#how-it-works" data-i18n="footer.how">${t('footer.how')}</a>
                    <a href="index.html#categories" data-i18n="footer.categories">${t('footer.categories')}</a>
                    <a href="yordam.html" data-i18n="footer.blog">${t('footer.blog')}</a>
                </div>
                <div>
                    <h4 data-i18n="footer.help_title">${t('footer.help_title')}</h4>
                    <a href="yordam.html" data-i18n="footer.help_center">${t('footer.help_center')}</a>
                    <a href="yordam.html" data-i18n="footer.safety">${t('footer.safety')}</a>
                    <a href="yordam.html" data-i18n="footer.rules">${t('footer.rules')}</a>
                    <a href="yordam.html" data-i18n="footer.contacts">${t('footer.contacts')}</a>
                </div>
            </div>
        </div>
        <div class="unified-footer-bottom">
            <p data-i18n="footer.copyright">${t('footer.copyright')}</p>
        </div>
    `;

    applyI18n(footer);
}

function initCustomSelects(root = document) {
    const scope = root.nodeType === Node.DOCUMENT_NODE ? root : root;
    scope.querySelectorAll('select:not([data-custom-select-ready])').forEach(select => {
        if (select.closest('.native-select-keep')) return;

        select.dataset.customSelectReady = 'true';
        select.classList.add('native-select-hidden');
        select.setAttribute('aria-hidden', 'true');
        select.parentElement?.classList.add('custom-select-active');
        const legacyArrow = select.parentElement?.querySelector('.select-arrow, .edit-select-arrow, .fa-chevron-down');
        if (legacyArrow) legacyArrow.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'app-custom-select';
        const originClasses = Array.from(select.classList).filter(Boolean).map(cls => `select-origin-${cls}`).slice(0, 3);
        if (originClasses.length) wrapper.classList.add(...originClasses);
        if (select.disabled) wrapper.classList.add('disabled');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'app-custom-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const label = document.createElement('span');
        label.className = 'app-custom-select-label';

        const icon = document.createElement('i');
        icon.className = 'fas fa-chevron-down app-custom-select-icon';

        const menu = document.createElement('div');
        menu.className = 'app-custom-select-menu';
        menu.setAttribute('role', 'listbox');

        trigger.append(label, icon);
        wrapper.append(trigger, menu);
        select.insertAdjacentElement('afterend', wrapper);

        const syncFromSelect = () => {
            const selected = select.options[select.selectedIndex];
            label.textContent = selected ? selected.textContent.trim() : '';
            wrapper.classList.toggle('has-placeholder', !select.value);
            wrapper.classList.toggle('disabled', select.disabled);
            Array.from(menu.children).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === select.value);
                item.setAttribute('aria-selected', String(item.dataset.value === select.value));
            });
        };

        const rebuildOptions = () => {
            menu.innerHTML = '';
            Array.from(select.options).forEach(option => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'app-custom-select-option';
                item.dataset.value = option.value;
                item.textContent = option.textContent.trim();
                item.disabled = option.disabled;
                item.setAttribute('role', 'option');
                item.addEventListener('click', () => {
                    if (option.disabled) return;
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    closeCustomSelect(wrapper);
                    syncFromSelect();
                });
                menu.appendChild(item);
            });
            syncFromSelect();
        };

        trigger.addEventListener('click', event => {
            event.stopPropagation();
            if (select.disabled) return;
            const willOpen = !wrapper.classList.contains('open');
            document.querySelectorAll('.app-custom-select.open').forEach(closeCustomSelect);
            wrapper.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', String(willOpen));
        });

        select.addEventListener('change', syncFromSelect);
        select.addEventListener('invalid', () => wrapper.classList.add('invalid'));
        select.addEventListener('input', () => wrapper.classList.remove('invalid'));

        const optionObserver = new MutationObserver(rebuildOptions);
        optionObserver.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });

        rebuildOptions();
    });
}

function closeCustomSelect(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('open');
    wrapper.querySelector('.app-custom-select-trigger')?.setAttribute('aria-expanded', 'false');
}

function startCustomSelectObserver() {
    if (!document.body || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(mutations => {
        if (mutations.some(m => Array.from(m.addedNodes || []).some(n => n.nodeType === Node.ELEMENT_NODE && (n.matches?.('select') || n.querySelector?.('select'))))) {
            initCustomSelects(document);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeMobileDrawer();
        document.querySelector('.lang-switcher.open')?.classList.remove('open');
        document.querySelectorAll('.app-custom-select.open').forEach(closeCustomSelect);
    }
});

document.addEventListener('click', () => {
    document.querySelectorAll('.app-custom-select.open').forEach(closeCustomSelect);
});

window.addEventListener('profile:updated', event => {
    refreshGlobalAvatars(event.detail || getCurrentUser());
});

window.addEventListener('storage', event => {
    if (event.key !== 'currentUser') return;
    refreshGlobalAvatars(getCurrentUser());
});

document.addEventListener('DOMContentLoaded', async () => {
    let user = getCurrentUser();
    const publicPages = ['index.html', 'kirish.html', 'register.html', 'yordam.html', ''];
    const page = currentPageName();

    if (!user && _supabase) {
        const { data } = await _supabase.auth.getUser();
        if (data?.user) {
            try {
                user = await fetchProfile(data.user.id, data.user);
                saveCurrentUser(user);
            } catch (err) {
                console.error('Profile fetch error:', err);
            }
        }
    }

    renderUnifiedHeader(user);
    renderUnifiedFooter();
    applyI18n();
    initCustomSelects();
    startCustomSelectObserver();
    refreshGlobalAvatars(user);
    startI18nObserver();

    if (!publicPages.includes(page)) {
        await requireAuth();
    }

    if (user) {
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = getUserFullName(user);
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && !profileAvatar.classList.contains('has-photo') && !user.avatar_url) profileAvatar.textContent = getUserInitials(user);
    }
});
