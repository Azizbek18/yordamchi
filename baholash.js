
document.addEventListener('DOMContentLoaded', async () => {

    function showToast(text, type = "success") {
        Toastify({
            text: text,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: { background: type === "success" ? "#006653" : "#e53e3e" }
        }).showToast();
    }

    const loadingState = document.getElementById('ratingLoadingState');
    const content = document.getElementById('ratingContent');
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    function showMessage(text) {
        loadingState.textContent = text;
        loadingState.style.display = 'block';
        content.style.display = 'none';
    }

    if (!user || !_supabase) {
        showMessage("Baholash uchun tizimga kiring.");
        return;
    }

    const myRole = user.role === 'employer' ? 'poster' : 'helper';

    // Find the most recent completed task involving this user that hasn't been reviewed yet
    const { data: completedTasks, error: tasksError } = await _supabase
        .from('tasks')
        .select('id, poster_id, helper_id, title, completed_at')
        .eq('status', 'completed')
        .or(`poster_id.eq.${user.id},helper_id.eq.${user.id}`)
        .order('completed_at', { ascending: false })
        .limit(20);

    if (tasksError) {
        showMessage("Ma'lumotlarni yuklab bo'lmadi: " + tasksError.message);
        return;
    }

    if (!completedTasks || completedTasks.length === 0) {
        showMessage("Hozircha baholaydigan yakunlangan topshiriq yo'q.");
        return;
    }

    const { data: myReviews } = await _supabase
        .from('reviews')
        .select('task_id')
        .eq('reviewer_id', user.id);

    const reviewedTaskIds = new Set((myReviews || []).map(r => r.task_id));
    const task = completedTasks.find(t => !reviewedTaskIds.has(t.id) && t.helper_id);

    if (!task) {
        showMessage("Barcha yakunlangan topshiriqlarni allaqachon baholagansiz. Rahmat!");
        return;
    }

    const revieweeId = myRole === 'poster' ? task.helper_id : task.poster_id;
    const { data: reviewee, error: revieweeError } = await _supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', revieweeId)
        .maybeSingle();

    if (revieweeError || !reviewee) {
        showMessage("Foydalanuvchi ma'lumotini yuklab bo'lmadi.");
        return;
    }

    const revieweeName = [reviewee.first_name, reviewee.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

    document.getElementById('ratingSubtitle').innerHTML = `${revieweeName} yordami sizga ma'qul keldimi?<br>Tajribangiz bilan bo'lishing.`;
    document.getElementById('ratingProfileName').textContent = revieweeName;
    const avatarImg = document.getElementById('ratingAvatar');
    avatarImg.src = reviewee.avatar_url || 'https://ui-avatars.com/api/?background=006653&color=fff&name=' + encodeURIComponent(revieweeName);
    avatarImg.alt = revieweeName;

    loadingState.style.display = 'none';
    content.style.display = 'block';

    // ── Xislat taglarini tanlash (Toggle active) ──
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => tag.classList.toggle('active'));
    });

    // ── Yulduzchalarni bosganda baholash tizimi ──
    let selectedRating = 0;
    const stars = document.querySelectorAll('#ratingStars i');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });

    document.querySelector('.close-btn')?.addEventListener('click', () => {
        window.location.href = 'mahallam.html';
    });

    document.getElementById('ratingSubmitBtn')?.addEventListener('click', async () => {
        if (selectedRating === 0) {
            showToast("Iltimos, avval yulduzcha bilan baho bering", "error");
            return;
        }

        const selectedTags = Array.from(document.querySelectorAll('.tag.active')).map(t => t.textContent);
        const commentText = document.getElementById('ratingComment').value.trim();
        const fullComment = [selectedTags.join(', '), commentText].filter(Boolean).join(' — ');

        const { error: insertError } = await _supabase.from('reviews').insert({
            task_id: task.id,
            reviewer_id: user.id,
            reviewee_id: revieweeId,
            rating: selectedRating,
            comment: fullComment || null,
            reviewer_role: myRole
        });

        if (insertError) {
            showToast("Baho yuborilmadi: " + insertError.message, "error");
            return;
        }

        showToast("Rahmat! Bahoyingiz yuborildi 🎉");
        setTimeout(() => {
            window.location.href = 'mahallam.html';
        }, 1500);
    });
});
