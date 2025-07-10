window.renderLists = function () {
    // --- 1. 보조 함수 (스타일) ---
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

    // --- 2. 카테고리 필터 ---
    const tabs = document.querySelectorAll('.challenge-tabs .tab');
    let selectedCategory = "전체";
    tabs.forEach(tab => {
        tab.onclick = function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.textContent.trim();
            renderLists();
        }
    });

    // --- 3. 도전 데이터 불러오기 + completedGoals 보정 ---
    const data = JSON.parse(localStorage.getItem('challenges') || '[]');
    let changed = false;
    data.forEach(ch => {
        if (!('completedGoals' in ch)) {
            ch.completedGoals = [];
            changed = true;
        }
    });
    if (changed) localStorage.setItem('challenges', JSON.stringify(data));

    // --- 4. 진행률 계산 (completedGoals/전체 goals) ---
    function calcProgress(ch) {
        const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
        const total = (ch.goals || []).length;

        const done = (ch.goals || []).filter(goalContent =>
            certRecords.some(cert =>
                cert.goal === goalContent && cert.challengeId === ch.id  // 🔥 도전 ID까지 비교
            )
        ).length;

        if (!total) return 0;
        return Math.round((done / total) * 100);
    }


    // --- 5. 리스트/사이드카드 렌더 함수 ---
    function renderLists() {
        const list = document.querySelector('.challenge-list');
        const sideCards = document.querySelector('.challenge-side-cards');
        if (!list || !sideCards) return;

        list.innerHTML = '';
        // 카테고리 필터링
        const filtered = selectedCategory === "전체"
            ? data
            : data.filter(ch => ch.category === selectedCategory);

        if (filtered.length === 0) {
            list.innerHTML = "<div style='padding:32px;color:#666;font-family:\"Segoe UI\";font-size:12px;font-weight:600;line-height:15px;'>해당 카테고리의 도전이 없습니다. 새로운 도전을 추가해보세요!</div>";
        }

        // 리스트 각 행
        filtered.slice().reverse().forEach(ch => {

            console.log('도전 타이틀:', ch.title);
            // D+N 계산
            let dDayText = '';
            if (ch.startDate) {
                const start = new Date(ch.startDate);
                const now = new Date();
                const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                dDayText = `D+${diff >= 0 ? diff : 0} ${ch.category}`;
            } else {
                dDayText = ch.category || '';
            }

            // 퍼센트 계산
            const percent = calcProgress(ch);

            // 첫 세부목표
            let firstGoal = '';
            if (Array.isArray(ch.goals)) {
                firstGoal = ch.goals.find(goal => 
                    !(Array.isArray(ch.completedGoalContents) && ch.completedGoalContents.includes(goal))
                ) || '다음 세부 목표 없음';
            }
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
            row.style.cursor = 'pointer';
            row.onclick = function () {
                window.location.href = `/challenges/detail/${ch.id}/`;
            };
            list.appendChild(row);
        });

        // --- 6. 사이드카드 인증(오늘 인증 대상) ---
        sideCards.innerHTML = '';

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const soonToEnd = filtered
            .filter(ch => ch.endDate) // 종료일 있는 도전만
            .map(ch => {
                const end = new Date(ch.endDate);
                end.setHours(0, 0, 0, 0);
                const remain = Math.max(0, Math.floor((end - now) / (1000 * 60 * 60 * 24)));
                return { ...ch, remain };
            })
            .sort((a, b) => a.remain - b.remain) // 남은 일수 오름차순
            .slice(0, 3);

        if (soonToEnd.length === 0) {
            sideCards.innerHTML = `<div style="padding:20px;color:#aaa;">표시할 도전이 없습니다.</div>`;
            return;
        }

        soonToEnd.forEach(ch => {
            const certImgStyle = makeCertImgStyle(ch.imgDataUrl);
            const div = document.createElement('div');
            div.className = 'cert-card';
            div.innerHTML = `
                <div class="cert-img" style="${certImgStyle}"></div>
                <div class="cert-category">${ch.category}</div>
                <div class="cert-title">${ch.title}</div>
                <a href="#" class="cert-link">인증하러 가기 →</a>
            `;
            sideCards.appendChild(div);

            // "인증하러 가기" 클릭 시 certAdd 페이지로 이동
            const link = div.querySelector('.cert-link');
            link.onclick = function (e) {
                e.preventDefault();
                window.location.href = `/challenges/detail/${ch.id}/`;
            };


        });

    }

    // --- 7. 최초 렌더 ---
    renderLists();

    // --- 8. 도전 추가 버튼 ---
    const addBtn = document.getElementById('addChallengeBtn');
    if (addBtn) {
        addBtn.onclick = function () {
            window.location.href = "/challenges/challenge/create/";
        };
    }
};