document.addEventListener('DOMContentLoaded', async () => {
    const me = await requireAuth();
    if (!me) return;

    const chatList = document.getElementById('chatList');
    const chatSearchInput = document.getElementById('chatSearchInput');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatHeaderName = document.getElementById('chatHeaderName');
    const chatHeaderStatus = document.getElementById('chatHeaderStatus');
    const emptyChatWindow = document.getElementById('emptyChatWindow');
    const chatInputArea = document.getElementById('chatInputArea');
    const chatPanel = document.getElementById('chatPanel');
    const chatWindow = document.getElementById('chatWindow');
    const backBtn = document.getElementById('backBtn');

    if (!_supabase) {
        chatList.innerHTML = `<div class="chat-list-state"><i class="fa-solid fa-wifi"></i>Supabase ulanishi yuklanmadi. Internet yoki CDN ulanishini tekshiring.</div>`;
        return;
    }

    const state = {
        profiles: new Map(),
        threads: [],
        activePeerId: sessionStorage.getItem('chatPeerId') || null,
        activeConversationId: null,
        activeThreadSchema: 'conversations',
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
        const { data: conversations, error } = await _supabase
            .from('conversations')
            .select('*')
            .or(`participant1_id.eq.${me.id},participant2_id.eq.${me.id}`)
            .order('updated_at', { ascending: false });

        if (error) {
            if (isMissingRelationError(error)) {
                await loadThreadsFromLegacyChats();
                return;
            }
            chatList.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return;
        }

        const conversationIds = (conversations || []).map(item => item.id);
        const { data: messages } = conversationIds.length
            ? await _supabase
                .from('messages')
                .select('*')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false })
            : { data: [] };

        state.threads = (conversations || []).map(conversation => {
            const peerId = conversation.participant1_id === me.id ? conversation.participant2_id : conversation.participant1_id;
            const threadMessages = (messages || []).filter(msg => msg.conversation_id === conversation.id);
            return {
                conversationId: conversation.id,
                schema: 'conversations',
                peerId,
                taskId: conversation.task_id || null,
                updatedAt: conversation.updated_at,
                lastMessage: threadMessages[0] || null,
                unread: threadMessages.filter(msg => msg.sender_id !== me.id && !msg.read_at).length
            };
        });
        await Promise.all(state.threads.map(thread => ensureProfile(thread.peerId)));
        renderThreadList();
    }

    async function loadThreadsFromLegacyChats() {
        const { data: myRows, error } = await _supabase
            .from('chat_participants')
            .select('chat_id,user_id')
            .eq('user_id', me.id);

        if (error) {
            chatList.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return;
        }

        const chatIds = (myRows || []).map(row => row.chat_id);
        if (!chatIds.length) {
            state.threads = [];
            renderThreadList();
            return;
        }

        const [{ data: participants }, { data: chats }, { data: messages }] = await Promise.all([
            _supabase.from('chat_participants').select('chat_id,user_id').in('chat_id', chatIds),
            _supabase.from('chats').select('*').in('id', chatIds),
            _supabase.from('messages').select('*').in('chat_id', chatIds).order('created_at', { ascending: false })
        ]);

        state.threads = chatIds.map(chatId => {
            const peer = (participants || []).find(row => row.chat_id === chatId && row.user_id !== me.id);
            const chat = (chats || []).find(item => item.id === chatId) || {};
            const threadMessages = (messages || []).filter(msg => msg.chat_id === chatId);
            return {
                conversationId: chatId,
                schema: 'chats',
                peerId: peer?.user_id,
                taskId: chat.task_id || null,
                updatedAt: threadMessages[0]?.created_at || chat.created_at,
                lastMessage: threadMessages[0] || null,
                unread: threadMessages.filter(msg => msg.sender_id !== me.id && msg.is_read === false).length
            };
        }).filter(thread => thread.peerId);

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
            const lastMessageText = thread.lastMessage ? (thread.lastMessage.content || '') : 'Yangi suhbat';
            const lastMessageTime = thread.lastMessage?.created_at || thread.updatedAt;
            return `
                <div class="chat-item ${active}" data-peer-id="${thread.peerId}" data-conversation-id="${thread.conversationId}" data-schema="${thread.schema}">
                    <div class="avatar-fallback">${getUserInitials(profile)}</div>
                    <div class="chat-info">
                        <div class="chat-name-row">
                            <span class="name">${escapeHtml(getUserFullName(profile))}</span>
                            <span class="time">${formatTime(lastMessageTime)}</span>
                        </div>
                        <p class="last-msg">${escapeHtml(lastMessageText)}</p>
                    </div>
                    ${unread}
                </div>
            `;
        }).join('');

        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => openThread(item.dataset.peerId, item.dataset.conversationId, item.dataset.schema));
        });
    }

    async function openThread(peerId, conversationId = null, schema = null) {
        state.activePeerId = peerId;
        const existing = state.threads.find(thread => thread.peerId === peerId);
        state.activeThreadSchema = schema || existing?.schema || 'conversations';
        state.activeConversationId = conversationId || await getOrCreateConversation(peerId);
        const profile = await ensureProfile(peerId);
        chatHeaderName.textContent = getUserFullName(profile);
        chatHeaderStatus.textContent = t('chat.online');
        emptyChatWindow.style.display = 'none';
        chatPanel?.classList.add('hidden');
        chatWindow?.classList.add('active');
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
        if (!state.activeConversationId) return;
        messagesContainer.innerHTML = `<div class="chat-list-state">${t('common.loading')}</div>`;
        const { data, error } = await _supabase
            .from('messages')
            .select('*')
            .eq(state.activeThreadSchema === 'chats' ? 'chat_id' : 'conversation_id', state.activeConversationId)
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
        const isRead = msg.read_at || msg.is_read;
        const read = mine ? `<span class="read-status">${isRead ? 'O\'qildi' : 'Yuborildi'}</span>` : '';
        return `
            <div class="message ${mine ? 'sent' : 'received'}" data-message-id="${msg.id}">
                <div class="message-bubble">
                    <p>${escapeHtml(msg.content)}</p>
                    <span class="msg-time">${formatTime(msg.created_at)}</span>
                    ${read}
                </div>
            </div>
        `;
    }

    async function sendMessage() {
        const body = messageInput.value.trim();
        if (!body || !state.activePeerId) return;
        if (!state.activeConversationId) {
            state.activeConversationId = await getOrCreateConversation(state.activePeerId);
        }
        if (!state.activeConversationId) return;
        messageInput.value = '';

        const payload = {
            sender_id: me.id,
            content: body
        };
        payload[state.activeThreadSchema === 'chats' ? 'chat_id' : 'conversation_id'] = state.activeConversationId;

        const { error } = await _supabase.from('messages').insert(payload);

        if (error) {
            messageInput.value = body;
            alert(error.message);
        }
    }

    async function markAsRead() {
        if (!state.activeConversationId) return;
        const updatePayload = state.activeThreadSchema === 'chats'
            ? { is_read: true }
            : { read_at: new Date().toISOString() };
        const queryColumn = state.activeThreadSchema === 'chats' ? 'chat_id' : 'conversation_id';

        let query = _supabase
            .from('messages')
            .update(updatePayload)
            .eq(queryColumn, state.activeConversationId)
            .neq('sender_id', me.id);
        query = state.activeThreadSchema === 'chats' ? query.eq('is_read', false) : query.is('read_at', null);
        await query;

        const thread = state.threads.find(item => item.peerId === state.activePeerId);
        if (thread) thread.unread = 0;
        renderThreadList();
    }

    function subscribeRealtime() {
        _supabase
            .channel(`messages:${me.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
                const msg = payload.new;
                const incomingThreadId = msg.conversation_id || msg.chat_id;
                const thread = state.threads.find(item => item.conversationId === incomingThreadId);
                if (!thread && msg.sender_id !== me.id) {
                    await loadThreads();
                    return;
                }
                const peerId = thread?.peerId || state.activePeerId;
                if (!peerId) return;
                await ensureProfile(peerId);
                await loadThreads();
                if (state.activeConversationId === incomingThreadId) {
                    await loadMessages();
                    await markAsRead();
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
                const node = messagesContainer.querySelector(`[data-message-id="${payload.new.id}"] .read-status`);
                if (node && (payload.new.read_at || payload.new.is_read)) node.textContent = 'O\'qildi';
            })
            .subscribe();
    }

    async function getOrCreateConversation(peerId) {
        const existing = state.threads.find(thread => thread.peerId === peerId);
        if (existing) {
            state.activeThreadSchema = existing.schema;
            return existing.conversationId;
        }

        const { data, error } = await _supabase.rpc('get_or_create_conversation', {
            p_current_user_id: me.id,
            p_other_user_id: peerId,
            p_task_id: state.activeJobId || null
        });

        if (error) {
            if (isMissingRelationError(error)) {
                return createLegacyChat(peerId);
            }
            chatList.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return null;
        }

        await loadThreads();
        return data;
    }

    async function createLegacyChat(peerId) {
        state.activeThreadSchema = 'chats';
        const { data: chat, error } = await _supabase
            .from('chats')
            .insert({ task_id: state.activeJobId || null })
            .select('id')
            .single();

        if (error) {
            chatList.innerHTML = `<div class="chat-list-state">${error.message}</div>`;
            return null;
        }

        await _supabase.from('chat_participants').insert([
            { chat_id: chat.id, user_id: me.id },
            { chat_id: chat.id, user_id: peerId }
        ]);
        await loadThreads();
        return chat.id;
    }

    function isMissingRelationError(error) {
        const message = String(error?.message || '').toLowerCase();
        return error?.code === '42P01' || message.includes('does not exist') || message.includes('could not find');
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
        backBtn?.addEventListener('click', () => {
            chatPanel?.classList.remove('hidden');
            chatWindow?.classList.remove('active');
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
