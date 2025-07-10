// 전역 상태
let selectedCategory = "학습 / 공부";
let selectedChallengeId = null;
let selectedCertId = null;
let certRecords = [];  // 전역으로 선언

// 쿠키 가져오기 함수 (CSRF 토큰용)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

console.log("챌린지 데이터:", challenges);

// 렌더 함수
window.renderPostAdd = function () {
  const main = document.querySelector('.main-content');
  const categories = ["학습 / 공부", "커리어 / 직무", "운동 / 건강", "마음 / 루틴", "정리 / 관리", "취미", "기타"];

  // Django에서 넘긴 JSON 구조에 맞게 파싱
  const challengesData = challenges.map(obj => ({
    id: obj.id,
    category: obj.category,
    title: obj.title
  }));

  const filteredChallenges = challengesData.filter(ch => ch.category === selectedCategory);
  const filteredCerts = certRecords.filter(cert => String(cert.challengeId) === String(selectedChallengeId));

  main.innerHTML = `
    <div class="post-add-flexbox">
      <div class="post-add-left">
        <div class="post-add-title">게시할 인증 기록을 선택해주세요</div>
        <div class="post-add-cat-row">
          ${categories.map(cat => `
            <button class="post-add-cat-btn${cat === selectedCategory ? ' selected' : ''}" data-cat="${cat}">${cat}</button>
          `).join("")}
        </div>
        <div class="post-add-challenge-row">
          <span class="post-add-label">도전 선택</span>
          <select id="challenge-select" class="post-add-challenge-select" ${filteredChallenges.length === 0 ? "disabled" : ""}>
            <option value="">도전을 선택하세요</option>
            ${filteredChallenges.map(ch => `
              <option value="${ch.id}" ${String(ch.id) === String(selectedChallengeId) ? "selected" : ""}>${ch.title}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <div class="post-add-divider"></div>

      <div class="post-add-right">
        <button class="post-add-close-btn" title="닫기" aria-label="닫기">
          <img src="/static/assets/Cancel.svg" alt="닫기" />
        </button>
        <div class="post-add-cert-list">
          ${!selectedChallengeId
            ? `<div style="color:#aaa;padding:40px 0;">도전을 먼저 선택하세요.</div>`
            : (filteredCerts.length === 0
              ? `<div style="color:#aaa;padding:40px 0;">인증 기록이 없습니다.</div>`
              : filteredCerts.map(cert => `
                <div class="challenge-record-card${String(cert.id) === String(selectedCertId) ? ' selected' : ''}" data-cert-id="${cert.id}">
                  <div class="record-thumb" style="${cert.image_url
                    ? `background:url('${cert.image_url}') center/cover no-repeat;`
                    : `background:#ededf1;`} border-radius:10px;width:44px;height:44px;">
                  </div>
                  <div class="record-detail">
                    <div class="record-date">${cert.date || ''}</div>
                    <div class="record-title">${cert.goalTitle || ''}</div>
                    <div class="record-content">
                      <span class="record-content-body">${cert.content || ''}</span>
                    </div>
                  </div>
                </div>
              `).join("")
            )
          }
        </div>
        <button class="post-add-submit-btn" ${!selectedCertId ? "disabled" : ""}>게시하기</button>
      </div>
    </div>
  `;

  // === 이벤트 바인딩 ===

  // 카테고리 버튼 클릭
  main.querySelectorAll('.post-add-cat-btn').forEach(btn => {
    btn.onclick = function () {
      selectedCategory = this.dataset.cat;
      selectedChallengeId = null;
      selectedCertId = null;
      window.renderPostAdd();
    };
  });

  // 도전 선택 변경
  const challengeSelect = main.querySelector('#challenge-select');
  if (challengeSelect) {
    challengeSelect.addEventListener('change', function () {
      selectedChallengeId = this.value || null;
      selectedCertId = null;

      fetch(`/community/load_goal_progresses/?challenge_id=${selectedChallengeId}`)
        .then(res => res.json())
        .then(data => {
          certRecords = data;
          localStorage.setItem('certRecords', JSON.stringify(certRecords));
          window.renderPostAdd();
        })
        .catch(() => alert("인증 기록을 불러오지 못했습니다."));
    });
  }

  // 인증글 카드 선택
  main.querySelectorAll('.challenge-record-card').forEach(card => {
    card.onclick = function () {
      selectedCertId = this.dataset.certId;
      window.renderPostAdd();
    };
  });

  // 게시하기 버튼 클릭
  const submitBtn = main.querySelector('.post-add-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = function () {
      if (!selectedCertId) return;
      const cert = certRecords.find(c => String(c.id) === String(selectedCertId));
      const challenge = challengesData.find(ch => String(ch.id) === String(selectedChallengeId));
      if (!cert) return;

      fetch('/community/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: new URLSearchParams({
          goal_progress: cert.progressId
        })
      })
        .then(res => {
          if (!res.ok) throw new Error("게시 실패");
          alert("게시글이 등록되었습니다!");
          window.loadPage('community');
        })
        .catch(err => {
          console.error(err);
          alert("게시글 등록 중 오류가 발생했습니다.");
        });
    };
  }

  // 닫기 버튼
  const closeBtn = main.querySelector('.post-add-close-btn');
  if (closeBtn) {
    closeBtn.onclick = function () {
      const { pageName, detailKey } = window.getPrevPage?.() || {};
      if (pageName) {
        window.loadPage(pageName, detailKey);
      } else {
        window.loadPage('community');
      }
    };
  }
};

// 페이지 진입 시 자동 실행
window.onload = function () {
  if (window.renderPostAdd) window.renderPostAdd();
};