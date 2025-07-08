(function () {
    // ------ 이미지 스타일 함수 ------
    function makeIconStyle(imgDataUrl) {
        return imgDataUrl
            ? `background:url('${imgDataUrl}') center/cover no-repeat;border-radius:8px;width:40px;height:40px;`
            : 'width:40px;height:40px;background:#e9e9e9;border-radius:8px;';
    }

    function makeCertImgStyle(imgDataUrl) {
        return imgDataUrl
            ? `background:url('${imgDataUrl}') center/cover no-repeat;border-radius:12px;`
            : 'background:#d9d9d9;border-radius:12px;';
    }

    // ------ 데이터 불러오기 ------
    const data = JSON.parse(localStorage.getItem('challenges') || '[]');

    // ------ 전역 카테고리 변수 ------
    let selectedCategory = "전체";

    // --- 4. 진행률 계산 (completedGoals/전체 goals) ---
    function calcProgress(ch) {
        const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
        const myCerts = certRecords.filter(r => String(r.challengeId) === String(ch.id));
        const total = (ch.goals || []).length;
        const done = (ch.goals || []).filter(goal =>
            myCerts.some(cert => cert.goal === goal)
        ).length;
        if (!total) return 0;
        return Math.round((done / total) * 100);
    }

    // ------ 리스트/카드 렌더 함수 ------
    function renderLists() {
        const list = document.querySelector('.challenge-list');
        list.innerHTML = '';

        const filtered = selectedCategory === "전체"
            ? data
            : data.filter(ch => ch.category === selectedCategory);

        if (filtered.length === 0) {
            list.innerHTML = `
            <div style="padding:32px;color:#666;font-family:'Segoe UI';
            font-size:12px;font-weight:600;line-height:15px;">
              해당 카테고리의 도전이 없습니다. 새로운 도전을 추가해보세요!
            </div>`;
        }

        filtered.slice().reverse().forEach(ch => {
            const dDayText = ch.category || '';
            const percent = ch.progress || 0;
            const firstGoal = (ch.goals && ch.goals.length > 0) ? ch.goals[0] : '';
            const iconStyle = makeIconStyle(ch.imgDataUrl);

            const row = document.createElement('div');
            row.className = 'challenge-row';
            row.innerHTML = `
            <div class="challenge-info">
              <div class="challenge-icon" style="${iconStyle}"></div>
              <div class="challenge-info-texts">
                <div class="challenge-date">${dDayText}</div>
                <div class="challenge-title">${ch.title}</div>
              </div>
            </div>
            <div class="challenge-progress">
              <span class="progress-percent">${percent}%</span>
              <div class="progress-bar-bg">
                <div class="progress-bar" style="width:${percent}%"></div>
              </div>
            </div>
            <div class="challenge-goal">${firstGoal}</div>
          `;
            list.appendChild(row);
        });

        const sideCards = document.querySelector('.home-side-cards');
        sideCards.innerHTML = '';

        const cards = filtered;

        if (cards.length === 0) {
            sideCards.innerHTML = `<div style="padding:20px;color:#aaa;">오늘의 인증할 도전이 없습니다.</div>`;
            return;
        }

        cards.forEach(ch => {
            const certImgStyle = makeCertImgStyle(ch.imgDataUrl);
            const div = document.createElement('div');
            div.className = 'home-cert-card';
            div.innerHTML = `
            <div class="home-cert-img" style="${certImgStyle}"></div>
            <div class="home-cert-category">${ch.category}</div>
            <div class="home-cert-title">${ch.title}</div>
            <a href="#" class="home-cert-link">인증하러 가기 →</a>
          `;
            sideCards.appendChild(div);
        });
    }
    // ------ 최초 렌더 ------
    renderLists();

    // ------ 드롭다운 카테고리 필터 ------
    const dropdown = document.querySelector('.dropdown');
    const button = dropdown.querySelector('.dropbtn');
    const buttonText = dropdown.querySelector('.dropbtn-text');
    const items = dropdown.querySelectorAll('.dropdown-content li');

    // 버튼 클릭 시 토글
    button.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });

    // 항목 클릭 시 텍스트 변경 + 드롭다운 닫기 + 리스트 렌더
    items.forEach(item => {
        item.addEventListener('click', () => {
            selectedCategory = item.dataset.category;
            buttonText.textContent = selectedCategory;
            dropdown.classList.remove('active');
            renderLists();
        });
    });

    // 바깥 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });


    // ------ 인기 POST 카테고리 선택 -------
    document.querySelectorAll('.home-categoryBtn').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('.home-categoryBtn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        };
    });
})();
