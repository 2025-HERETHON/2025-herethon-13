(function () {
    let selectedCategory = SELECTED_CATEGORY;

    document.addEventListener('DOMContentLoaded', () => {
        const tabs = document.querySelectorAll('.badge-btnBox .badge-btn');
        tabs.forEach(tab => {
            tab.onclick = function () {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                selectedCategory = this.textContent.trim();
                renderBadgeList();
            };
        });

        renderBadgeList();
    });

    function renderBadgeList() {
        const container = document.querySelector('.badgelayout');
        container.innerHTML = '';

        const filtered = selectedCategory === "전체"
            ? BADGE_LIST
            : BADGE_LIST.filter(b => b.category === selectedCategory);

        document.querySelector('.badge-titleNumber').textContent = filtered.length;
        document.getElementById('badgeTitleTxt').innerHTML =
            `${USER_NICKNAME} 님이 달성한 “${selectedCategory}” 도전 뱃지&nbsp;`;

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding:32px;color:#666;">해당 카테고리의 뱃지가 없습니다.</div>`;
            return;
        }

        filtered.forEach(badge => {
            const badgeLink = document.createElement('a');
            badgeLink.href = `/challenges/detail/${badge.challengeId}/`; // Django URL 패턴에 맞게 이동
            badgeLink.style.textDecoration = 'none'; // 밑줄 제거
            badgeLink.style.color = 'inherit'; // 기본 색상 유지

            const badgeBox = document.createElement('div');
            badgeBox.className = 'badge-bigBox';

            let badgeImgsrc = "/static/assets/badge.svg";
            if (badge.category === "학습 / 공부") badgeImgsrc = "/static/assets/studyBadge.svg";
            else if (badge.category === "커리어 / 직무") badgeImgsrc = "/static/assets/careerBadge.svg";
            else if (badge.category === "운동 / 건강") badgeImgsrc = "/static/assets/healthBadge.svg";
            else if (badge.category === "마음 / 루틴") badgeImgsrc = "/static/assets/mindBadge.svg";
            else if (badge.category === "정리 / 관리") badgeImgsrc = "/static/assets/organizeBadge.svg";
            else if (badge.category === "취미") badgeImgsrc = "/static/assets/hobbyBadge.svg";
            else if (badge.category === "기타") badgeImgsrc = "/static/assets/etcBadge.svg";

            badgeBox.innerHTML = `
                <img class="studyBadge" src="${badgeImgsrc}" />
                <div class="badgeBox">
                    <div class="badgeyellowBox">${badge.title}</div>
                    <div class="badgePeriodBox">${badge.startDate} - ${badge.endDate}</div>
                </div>
            `;

            badgeLink.appendChild(badgeBox);
            container.appendChild(badgeLink);
        });
    }
})();