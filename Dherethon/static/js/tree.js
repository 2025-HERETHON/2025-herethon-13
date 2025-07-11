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
            treeImg.src = STATIC_PREFIX + "badgeTree.svg";
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
        treeImg.src = STATIC_PREFIX + "badgeTree.svg";
        layout.appendChild(treeImg);

        chunk.forEach((badge, index) => {
            const badgeImg = document.createElement('img');
            badgeImg.className = `tree-badge${index + 1}`;

            let badgeImgsrc = STATIC_PREFIX + "badge.svg";
            switch (badge.category) {
                case "학습 / 공부":
                    badgeImgsrc = STATIC_PREFIX + "studyBadge.svg"; break;
                case "커리어 / 직무":
                    badgeImgsrc = STATIC_PREFIX + "careerBadge.svg"; break;
                case "운동 / 건강":
                    badgeImgsrc = STATIC_PREFIX + "healthBadge.svg"; break;
                case "마음 / 루틴":
                    badgeImgsrc = STATIC_PREFIX + "mindBadge.svg"; break;
                case "정리 / 관리":
                    badgeImgsrc = STATIC_PREFIX + "organizeBadge.svg"; break;
                case "취미":
                    badgeImgsrc = STATIC_PREFIX + "hobbyBadge.svg"; break;
                case "기타":
                    badgeImgsrc = STATIC_PREFIX + "etcBadge.svg"; break;
                default:
                    badgeImgsrc = STATIC_PREFIX + "badge.svg";
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
    
    const closeBtn = document.getElementById('treeCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = function () {
            window.location.href = BADGE_LIST_URL;
        };
    }

})();
