
(function () {
    let selectedCategory = "전체";
    //최초렌더링
    renderBadgeListFromLocalStorage();

    //뱃지 만들기
    function renderBadgeListFromLocalStorage() {
        const container = document.querySelector('.badgelayout');
        container.innerHTML = '';

        const badgeList = JSON.parse(localStorage.getItem('badgeList') || '[]');

        const filtered = selectedCategory === "전체"
            ? badgeList
            : badgeList.filter(b => b.category === selectedCategory);

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding:32px;color:#666;">해당 카테고리의 뱃지가 없습니다.</div>`;
        }

        filtered.forEach(badge => {
            const badgeBox = document.createElement('div');
            badgeBox.className = 'badge-bigBox';

            let badgeImgsrc = "/assets/badge.svg";

            if (badge.category == "학습 / 공부") {
                badgeImgsrc = "/assets/studyBadge.svg";
            } else if (badge.category == "커리어 / 직무") {
                badgeImgsrc = "/assets/careerBadge.svg";
            } else if (badge.category == "운동 / 건강") {
                badgeImgsrc = "/assets/healthBadge.svg";
            } else if (badge.category == "마음 / 루틴") {
                badgeImgsrc = "/assets/mindBadge.svg";
            } else if (badge.category == "정리 / 관리") {
                badgeImgsrc = "/assets/organizeBadge.svg";
            } else if (badge.category == "취미") {
                badgeImgsrc = "/assets/hobbyBadge.svg";
            } else if (badge.category == "기타") {
                badgeImgsrc = "/assets/etcBadge.svg";
            }
            badgeBox.innerHTML = `
          <img class="studyBadge" src="${badgeImgsrc}" />
          <div class="badgeBox">
            <div class="badgeyellowBox">${badge.title}</div>
            <div class="badgePeriodBox">${badge.startDate} - ${badge.endDate}</div>
          </div>
        `;
            container.appendChild(badgeBox);
        });

        document.querySelector('.badge-titleNumber').textContent = filtered.length;
    }

    //필터링 및 카테고리 클릭 효과
    const tabs = document.querySelectorAll('.badge-btnBox .badge-btn');
    tabs.forEach(tab => {
        tab.onclick = function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.textContent.trim();
            renderBadgeListFromLocalStorage();
        };
    });

    document.addEventListener('DOMContentLoaded', () => {
        renderBadgeListFromLocalStorage();
    });

})();