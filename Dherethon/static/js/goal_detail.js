document.addEventListener('DOMContentLoaded', function () {
    // 공용 모달
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const closeBtn = document.getElementById('certDetailCloseBtn');
    const deleteBtn = document.getElementById('certDeleteBtn');
    const cancelBtn = document.getElementById('modalDeleteNo');
    const confirmBtn = document.getElementById('modalDeleteYes');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');

    const data = window.recordData;

    closeBtn?.addEventListener('click', function () {
        if (data.challengeId) {
            window.location.href = `/challenges/detail/${data.challengeId}/`;
        } else {
            window.location.href = '/challenges/';
        }
    });

    deleteBtn?.addEventListener('click', function () {
        modalCategory.textContent = data.category;
        modalTitle.textContent = data.title;
        openModal("deleteModal");
    });

    cancelBtn?.addEventListener('click', function () {
        closeModal("deleteModal");
    });

    confirmBtn?.addEventListener('click', function () {
        fetch(`/challenges/record/delete/${data.id}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
        .then((res) => {
            if (res.redirected) {
                window.location.href = res.url;
            } else {
                alert('삭제에 실패했습니다.');
            }
        })
        .catch((err) => {
            console.error('삭제 실패:', err);
            alert('서버 오류가 발생했습니다.');
        });
    });
});
