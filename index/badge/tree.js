(function () {
    const pageSize = 5;
    let currentPage = 0;
    const badgeList = JSON.parse(localStorage.getItem('badgeList') || '[]');
    const totalPages = Math.ceil(badgeList.length / pageSize);

    const container = document.querySelector('.tree-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');

    function renderTreePage(page) {
        container.innerHTML = '';

        if (totalPages === 0) {

            const layout = document.createElement('div');
            layout.className = 'tree-layout';

            const treeImg = document.createElement('img');
            treeImg.className = 'treeImg';
            treeImg.src = "/assets/badgeTree.svg";
            layout.appendChild(treeImg);

            container.appendChild(layout);
            pageIndicator.textContent = `0 / 0`;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const start = page * pageSize;
        const chunk = badgeList.slice(start, start + pageSize);

        const layout = document.createElement('div');
        layout.className = 'tree-layout';

        const treeImg = document.createElement('img');
        treeImg.className = 'treeImg';
        treeImg.src = "/assets/badgeTree.svg";
        layout.appendChild(treeImg);

        chunk.forEach((badge, index) => {
            const badgeImg = document.createElement('img');
            badgeImg.className = `tree-badge${index + 1}`;

            let badgeImgsrc = "/assets/badge.svg";
            switch (badge.category) {
                case "학습 / 공부":
                    badgeImgsrc = "/assets/studyBadge.svg"; break;
                case "커리어 / 직무":
                    badgeImgsrc = "/assets/careerBadge.svg"; break;
                case "운동 / 건강":
                    badgeImgsrc = "/assets/healthBadge.svg"; break;
                case "마음 / 루틴":
                    badgeImgsrc = "/assets/mindBadge.svg"; break;
                case "정리 / 관리":
                    badgeImgsrc = "/assets/organizeBadge.svg"; break;
                case "취미":
                    badgeImgsrc = "/assets/hobbyBadge.svg"; break;
                case "기타":
                    badgeImgsrc = "/assets/etcBadge.svg"; break;
            }

            badgeImg.src = badgeImgsrc;
            badgeImg.alt = badge.title;
            layout.appendChild(badgeImg);
        });

        container.appendChild(layout);
        pageIndicator.textContent = `${page + 1} / ${totalPages}`;

        prevBtn.disabled = page === 0;
        nextBtn.disabled = page === totalPages - 1;
    }

    // 초기 렌더
    renderTreePage(currentPage);

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            renderTreePage(currentPage);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderTreePage(currentPage);
        }
    });

    const closeBtn = document.getElementById('treeCloseBtn');                // 닫기(✕) 버튼

    // ===== (8) 닫기(✕) 버튼 이벤트 =====
    if (closeBtn) {
        closeBtn.onclick = function () {
            if (window.loadPage) {
                window.loadPage("badge");
            }
        };
    }
})();