document.addEventListener('DOMContentLoaded', async () => {
    const me = await requireAuth();
    if (!me || !_supabase) return;

    const chatList = document.getElementById('chatList');
    const chatSearchInput = document.getElementById('chatSearchInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatHeaderName = document.getElementById('chatHeaderName');
    const chatHeaderStatus = document.getElementById('chatHeaderStatus');
    const emptyChatWindow = document.getElementById('emptyChatWindow');
    const chatInputArea = document.getElementById('chatInputArea');

    const state = {
        profiles: new Map(),
        threads: [],
        activePeerId: sessionStorage.getItem('chatPeerId') || null,
        activeJobId: sessionStorage.getItem('chatJobId') || null,
        search: ''
    };
    sessionStorage.removeItem('chatPeerId');
    sessionStorage.removeItem('chatJobId');

    await loadThreads();
    bindEvents();
    subscribeRealtime();

    if (state.activePeerId) {
        await ensureProfile(state.activePeerId);
        openThread(state.activePeerId);
    }

    async function loadThreads() {
        chatList.innerHTML = `<div class="chat-list-state"><span class="spinner"></span><br>${t('common.loading')}</div>`;
        const { data, error } = await _supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            chatList.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return;
        }

        const grouped = new Map();
        (data || []).forEach(msg => {
            const peerId = msg.sender_id === me.id ? msg.receiver_id : msg.sender_id;
            if (!grouped.has(peerId)) {
                grouped.set(peerId, {
                    peerId,
                    lastMessage: msg,
                    unread: 0
                });
            }
            if (msg.receiver_id === me.id && !msg.read_at) {
                grouped.get(peerId).unread += 1;
            }
        });

        state.threads = Array.from(grouped.values());
        await Promise.all(state.threads.map(thread => ensureProfile(thread.peerId)));
        renderThreadList();
    }

    async function ensureProfile(profileId) {
        if (!profileId || state.profiles.has(profileId)) return state.profiles.get(profileId);
        const { data } = await _supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
        const profile = data || { id: profileId, full_name: 'Foydalanuvchi' };
        state.profiles.set(profileId, profile);
        return profile;
    }

    function renderThreadList() {
        const filtered = state.threads.filter(thread => {
            const profile = state.profiles.get(thread.peerId);
            return !state.search || getUserFullName(profile).toLowerCase().includes(state.search);
        });

        if (!filtered.length) {
            chatList.innerHTML = `<div class="chat-list-state"><i class="fa-regular fa-comments"></i>${t('chat.noChats')}</div>`;
            return;
        }

        chatList.innerHTML = filtered.map(thread => {
            const profile = state.profiles.get(thread.peerId);
            const active = thread.peerId === state.activePeerId ? 'active' : '';
            const unread = thread.unread ? `<div class="unread-count">${thread.unread}</div>` : '';
            return `
                <div class="chat-item ${active}" data-peer-id="${thread.peerId}">
                    <div class="avatar-fallback">${getUserInitials(profile)}</div>
                    <div class="chat-info">
                        <div class="chat-name-row">
                            <span class="name">${escapeHtml(getUserFullName(profile))}</span>
                            <span class="time">${formatTime(thread.lastMessage.created_at)}</span>
                        </div>
                        <p class="last-msg">${escapeHtml(thread.lastMessage.body || '')}</p>
                    </div>
                    ${unread}
                </div>
            `;
        }).join('');

        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => openThread(item.dataset.peerId));
        });
    }

    async function openThread(peerId) {
        state.activePeerId = peerId;
        const profile = await ensureProfile(peerId);
        chatHeaderName.textContent = getUserFullName(profile);
        chatHeaderStatus.textContent = t('chat.online');
        emptyChatWindow.style.display = 'none';
        messagesContainer.classList.add('active');
        chatInputArea.classList.add('active');
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = t('chat.type');
        renderThreadList();
        await loadMessages();
        await markAsRead();
    }

    async function loadMessages() {
        if (!state.activePeerId) return;
        messagesContainer.innerHTML = `<div class="chat-list-state">${t('common.loading')}</div>`;
        const { data, error } = await _supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${me.id},receiver_id.eq.${state.activePeerId}),and(sender_id.eq.${state.activePeerId},receiver_id.eq.${me.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            messagesContainer.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return;
        }

        messagesContainer.innerHTML = (data || []).map(renderMessage).join('');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function renderMessage(msg) {
        const mine = msg.sender_id === me.id;
        const read = mine ? `<span class="read-status">${msg.read_at ? 'O\'qildi' : 'Yuborildi'}</span>` : '';
        return `
            <div class="message ${mine ? 'sent' : 'received'}" data-message-id="${msg.id}">
                <div class="message-bubble">
                    <p>${escapeHtml(msg.body)}</p>
                    <span class="msg-time">${formatTime(msg.created_at)}</span>
                    ${read}
                </div>
            </div>
        `;
    }

    async function sendMessage() {
        const body = messageInput.value.trim();
        if (!body || !state.activePeerId) return;
        messageInput.value = '';

        const { error } = await _supabase.from('messages').insert({
            sender_id: me.id,
            receiver_id: state.activePeerId,
            job_id: state.activeJobId || null,
            body
        });

        if (error) {
            messageInput.value = body;
            alert(error.message);
        }
    }

    async function markAsRead() {
        if (!state.activePeerId) return;
        await _supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', state.activePeerId)
            .eq('receiver_id', me.id)
            .is('read_at', null);

        const thread = state.threads.find(item => item.peerId === state.activePeerId);
        if (thread) thread.unread = 0;
        renderThreadList();
    }

    function subscribeRealtime() {
        _supabase
            .channel(`messages:${me.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
                const msg = payload.new;
                if (msg.sender_id !== me.id && msg.receiver_id !== me.id) return;
                const peerId = msg.sender_id === me.id ? msg.receiver_id : msg.sender_id;
                await ensureProfile(peerId);
                await loadThreads();
                if (state.activePeerId === peerId) {
                    await loadMessages();
                    await markAsRead();
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
                const node = messagesContainer.querySelector(`[data-message-id="${payload.new.id}"] .read-status`);
                if (node && payload.new.read_at) node.textContent = 'O\'qildi';
            })
            .subscribe();
    }

    function bindEvents() {
        sendBtn?.addEventListener('click', sendMessage);
        messageInput?.addEventListener('keydown', e => {
            if (e.key === 'Enter') sendMessage();
        });
        chatSearchInput?.addEventListener('input', e => {
            state.search = e.target.value.trim().toLowerCase();
            renderThreadList();
        });
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function formatTime(value) {
        if (!value) return '';
        return new Intl.DateTimeFormat(getCurrentLanguage() === 'en' ? 'en-US' : getCurrentLanguage() === 'ru' ? 'ru-RU' : 'uz-UZ', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(value));
    }
});
