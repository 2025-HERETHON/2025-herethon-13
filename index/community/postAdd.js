// ====== 전역 상태 ======
let selectedCategory = "학습 / 공부";
let selectedChallengeId = null;
let selectedCertId = null;

window.renderPostAdd = function () {
  const main = document.querySelector('.main-content');
  const categories = ["학습 / 공부", "커리어 / 직무", "운동 / 건강", "마음 / 루틴", "정리 / 관리", "취미", "기타"];
  const challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
  const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');

  const filteredChallenges = challenges.filter(ch => ch.category === selectedCategory);
  const filteredCerts = certRecords.filter(cert =>
    String(cert.challengeId) === String(selectedChallengeId)
  );

  main.innerHTML = `
    <div class="post-add-flexbox">
      <!-- 좌측: 카테고리/도전 -->
      <div class="post-add-left">
        <div class="post-add-title">게시할 인증 기록을 선택해주세요</div>
        <div class="post-add-cat-row">
          ${categories.map(cat =>
    `<button class="post-add-cat-btn${cat === selectedCategory ? ' selected' : ''}" data-cat="${cat}">${cat}</button>`
  ).join("")}
        </div>
        <div class="post-add-challenge-row">
          <span class="post-add-label">도전 선택</span>
          <select class="post-add-challenge-select" ${filteredChallenges.length === 0 ? "disabled" : ""}>
            <option value="">도전을 선택하세요</option>
            ${filteredChallenges.map(ch =>
    `<option value="${ch.id}" ${String(ch.id) === String(selectedChallengeId) ? "selected" : ""}>${ch.title}</option>`
  ).join("")}
          </select>
        </div>
      </div>

      <div class="post-add-divider"></div>

      <!-- 우측: 인증글/게시버튼 -->
      <div class="post-add-right">
         <button class="post-add-close-btn" id="postAddCloseBtn" title="닫기" aria-label="닫기">
            <img src="../../assets/Cancel.svg" alt="닫기" />
          </button>
        <div class="post-add-cert-list">
          ${!selectedChallengeId
      ? `<div style="color:#aaa;padding:40px 0 0 0;">도전을 먼저 선택하세요.</div>`
      : (filteredCerts.length === 0
        ? `<div style="color:#aaa;padding:40px 0 0 0;">인증 기록이 없습니다.</div>`
        : filteredCerts.map(cert => `
                  <div class="challenge-record-card${String(cert.id) === String(selectedCertId) ? ' selected' : ''}" data-cert-id="${cert.id}">
                    <div class="record-thumb" style="
                      ${cert.imgDataUrl
            ? `background:url('${cert.imgDataUrl}') center/cover no-repeat;`
            : `background:#ededf1;`
          }
                      border-radius:10px;width:44px;height:44px;">
                    </div>
                    <div class="record-detail">
                      <div class="record-date">${(cert.date || '').replace(/-/g, '.')}.</div>
                      <div class="record-title">${cert.goal || ''}</div>
                      <div class="record-content">
                        <span class="record-content-title">${cert.title || ''}</span><br>
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

  // ===== 이벤트 바인딩 =====

  // 1. 카테고리 버튼
  main.querySelectorAll('.post-add-cat-btn').forEach(btn => {
    btn.onclick = function () {
      selectedCategory = this.dataset.cat;
      selectedChallengeId = null;
      selectedCertId = null;
      window.renderPostAdd();
    };
  });

  // 2. 도전 셀렉트
  const challengeSelect = main.querySelector('.post-add-challenge-select');
  if (challengeSelect && !challengeSelect.disabled) {
    challengeSelect.onchange = function () {
      selectedChallengeId = this.value || null;
      selectedCertId = null;
      window.renderPostAdd();
    };
  }

  // 3. 인증글 카드 선택
  main.querySelectorAll('.challenge-record-card').forEach(card => {
    card.onclick = function () {
      selectedCertId = this.dataset.certId;
      window.renderPostAdd();
    };
  });

  // 4. 게시하기 버튼
  const submitBtn = main.querySelector('.post-add-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = function () {
      if (!selectedCertId) return;
      const cert = certRecords.find(c => String(c.id) === String(selectedCertId));
      if (!cert) return;
      const challenge = challenges.find(ch => String(ch.id) === String(selectedChallengeId));

      let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
      posts.unshift({
        id: Date.now(),
        certId: cert.id, // ← 인증글과 연결하는 키!
        category: selectedCategory,
        challengeId: selectedChallengeId,
        challengeTitle: challenge ? challenge.title : "",
        title: cert.title || cert.goal || "",
        content: cert.content,
        date: cert.date,
        badge: cert.title ? '뉴스 기사 번역 해석' : '',
        imgDataUrl: cert.imgDataUrl || "",
        like: 0,
      });
      localStorage.setItem('communityPosts', JSON.stringify(posts));
      alert("게시글이 등록되었습니다!");
      if (window.loadPage) window.loadPage('community');
    };
  }

  // 5. 닫기 버튼 (이전 페이지 있으면 복귀, 없으면 community)
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

// 페이지 진입 시 자동 실행 (SPA)
window.onload = function () {
  if (window.renderPostAdd) window.renderPostAdd();
};