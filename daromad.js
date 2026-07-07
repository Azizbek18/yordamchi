
const TX_TYPE_META = {
    payment_release: { icon: 'fa-sack-dollar', badge: 'bg-light-teal', label: 'Topshiriq to\'lovi' },
    deposit: { icon: 'fa-plus', badge: 'bg-light-teal', label: 'Hisobni to\'ldirish' },
    payment_refund: { icon: 'fa-rotate-left', badge: 'bg-light-teal', label: 'Qaytarilgan to\'lov' },
    payment_freeze: { icon: 'fa-lock', badge: 'bg-light-red', label: 'Muzlatilgan to\'lov' },
    withdrawal: { icon: 'fa-money-bill-transfer', badge: 'bg-light-red', label: 'Pul yechish' }
};

function formatSom(amount) {
    return Math.round(Math.abs(amount)).toLocaleString('uz-UZ') + " so'm";
}

function formatTxDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' }) + ', ' +
        d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function renderTransactionItem(tx) {
    const meta = TX_TYPE_META[tx.type] || { icon: 'fa-circle-dollar-to-slot', badge: 'bg-light-teal', label: tx.type };
    const isPositive = Number(tx.amount) >= 0;
    return `
        <div class="transaction-item">
            <div class="tx-left">
                <div class="tx-icon-box ${meta.badge}"><i class="fa-solid ${meta.icon}"></i></div>
                <div class="tx-details">
                    <h4>${meta.label}</h4>
                    <p>${formatTxDate(tx.created_at)}</p>
                </div>
            </div>
            <div class="tx-amount ${isPositive ? 'tx-positive' : 'tx-negative'}">${isPositive ? '+' : '-'}${formatSom(tx.amount)}</div>
        </div>
    `;
}

function renderWeeklyChart(container, transactions) {
    const days = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        buckets.push({ date: day, total: 0, label: days[day.getDay()] });
    }

    transactions.forEach(tx => {
        const txDay = new Date(tx.created_at);
        txDay.setHours(0, 0, 0, 0);
        const bucket = buckets.find(b => b.date.getTime() === txDay.getTime());
        if (bucket && Number(tx.amount) > 0) bucket.total += Number(tx.amount);
    });

    const maxTotal = Math.max(...buckets.map(b => b.total), 1);
    container.innerHTML = buckets.map((b, i) => {
        const height = b.total > 0 ? Math.max(8, Math.round((b.total / maxTotal) * 150)) : 4;
        const isLast = i === buckets.length - 1;
        return `
            <div class="chart-bar-wrapper">
                <div class="chart-bar ${isLast ? 'active' : ''}" style="height: ${height}px;" title="${formatSom(b.total)}"></div>
                <span class="chart-day">${b.label}</span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.chart-bar').forEach(bar => {
        bar.addEventListener('click', () => {
            container.querySelectorAll('.chart-bar').forEach(b => b.classList.remove('active'));
            bar.classList.add('active');
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const btnWithdraw = document.querySelector(".btn-withdraw");
    const btnCopy = document.getElementById("btn-copy");
    const linkSupport = document.getElementById("link-support");
    const transactionList = document.getElementById("transactionList");
    const chartPlaceholder = document.getElementById("chartPlaceholder");

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (btnWithdraw) {
        btnWithdraw.addEventListener("click", () => {
            showToast("Pul yechish so'rovi qabul qilindi.");
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener("click", () => {
            const refCodeText = document.getElementById("ref-code").innerText;
            navigator.clipboard.writeText(refCodeText).then(() => {
                showToast("Referal kod nusxalandi!");
            }).catch(err => {
                console.error("Nusxalashda xatolik yuz berdi: ", err);
            });
        });
    }

    if (linkSupport) {
        linkSupport.addEventListener("click", (e) => {
            e.preventDefault();
            showToast("Yordam xizmati yuklanmoqda...");
        });
    }

    if (!user || !_supabase) {
        if (transactionList) transactionList.innerHTML = `<p class="tx-empty-state">Ma'lumotlarni ko'rish uchun tizimga kiring.</p>`;
        if (chartPlaceholder) renderWeeklyChart(chartPlaceholder, []);
        return;
    }

    // Referal kodi: haqiqiy foydalanuvchi ismi asosida
    const refCodeEl = document.getElementById("ref-code");
    if (refCodeEl) {
        const namePart = (user.first_name || 'USER').toUpperCase().replace(/[^A-Z]/g, '');
        refCodeEl.textContent = namePart + new Date().getFullYear();
    }

    // Asosiy balans (profiles.balance)
    const { data: profileRow } = await _supabase.from('profiles').select('balance').eq('id', user.id).maybeSingle();
    const balanceEl = document.getElementById("balanceValue");
    if (balanceEl) balanceEl.textContent = formatSom(profileRow?.balance || 0);

    // Bajarilgan topshiriqlar soni (gamifikatsiya progressi)
    const { count: completedCount } = await _supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('helper_id', user.id)
        .eq('status', 'completed');

    const target = 15;
    const done = completedCount || 0;
    const progressText = document.getElementById("badgeProgressText");
    const progressFill = document.getElementById("badgeProgressFill");
    if (progressText) progressText.textContent = `${done}/${target} topshiriq bajarilgan`;
    if (progressFill) progressFill.style.width = Math.min(100, Math.round((done / target) * 100)) + '%';

    // Tranzaksiyalar tarixi
    const { data: transactions, error } = await _supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        transactionList.innerHTML = `<p class="tx-empty-state">Tranzaksiyalarni yuklab bo'lmadi: ${error.message}</p>`;
        renderWeeklyChart(chartPlaceholder, []);
        return;
    }

    renderWeeklyChart(chartPlaceholder, transactions || []);

    if (!transactions || transactions.length === 0) {
        transactionList.innerHTML = `<p class="tx-empty-state">Hozircha tranzaksiyalar yo'q.</p>`;
    } else {
        transactionList.innerHTML = transactions.map(renderTransactionItem).join('');
    }

    // Bu oy / o'tgan oy daromadi solishtirish (faqat musbat tranzaksiyalar)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    (transactions || []).forEach(tx => {
        if (Number(tx.amount) <= 0) return;
        const created = new Date(tx.created_at);
        if (created >= thisMonthStart) thisMonthTotal += Number(tx.amount);
        else if (created >= lastMonthStart && created < thisMonthStart) lastMonthTotal += Number(tx.amount);
    });

    const monthIncomeEl = document.getElementById("monthIncome");
    if (monthIncomeEl) monthIncomeEl.textContent = formatSom(thisMonthTotal);

    const trendEl = document.getElementById("trendValue");
    if (trendEl) {
        if (lastMonthTotal === 0) {
            trendEl.textContent = thisMonthTotal > 0 ? "Yangi daromad" : "O'zgarish yo'q";
        } else {
            const change = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
            trendEl.textContent = `${change >= 0 ? '+' : ''}${change}% o'tgan oydan`;
        }
    }
});
