let selectedCategory = "전체";
let selectedChallengeId = null;
let selectedGoalProgressId = null;
let goalProgresses = [];

function getCSRFToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrftoken=`);
  return parts.length === 2 ? parts.pop().split(";").shift() : "";
}

const main = document.querySelector('.main-content');

function safeParseJSON(jsonStr) {
  try {
    return JSON.parse(jsonStr || '[]');
  } catch (e) {
    console.error('JSON parse error:', e);
    return [];
  }
}

window.onload = function () {
  renderPostAddPage();
};

function renderPostAddPage() {
  const challenges = safeParseJSON(window.challengesRaw);
  const progresses = safeParseJSON(window.goalProgressesRaw);

 const categories = ["전체", ...new Set(challenges.map(ch => ch.category))];

  const filteredChallenges = selectedCategory === "전체"
    ? challenges
    : challenges.filter(ch => ch.category === selectedCategory);
  const filteredGoals = progresses.filter(p => String(p.challenge_id) === String(selectedChallengeId));

  main.innerHTML = `
    <div class="post-add-flexbox">
      <div class="post-add-left">
        <h2 class="post-add-title">게시할 인증 기록을 선택해주세요</h2>
        <div class="post-add-cat-row">
          ${categories.map(cat => `<button class="post-add-cat-btn${cat === selectedCategory ? ' selected' : ''}" data-cat="${cat}">${cat}</button>`).join("")}
        </div>
        <div class="post-add-challenge-row">
          <label class="post-add-label" for="challenge-select">도전 선택</label>
          <select class="post-add-challenge-select" id="challenge-select">
            <option value="">도전을 선택하세요</option>
            ${filteredChallenges.map(ch => `
              <option value="${ch.id}" ${String(ch.id) === String(selectedChallengeId) ? "selected" : ""}>
                ${ch.title}
              </option>
            `).join("")}
          </select>
        </div>
      </div>

      <div class="post-add-divider"></div>

      <div class="post-add-right">
        <div class="post-add-cert-list">
          ${
            !selectedChallengeId
              ? `<p style="color:#aaa;">도전을 먼저 선택하세요.</p>`
              : (filteredGoals.length === 0
                ? `<p style="color:#aaa;">선택한 도전에 인증된 기록이 없습니다.</p>`
                : filteredGoals.map(goal => `
                  <div class="challenge-record-card${String(goal.id) === String(selectedGoalProgressId) ? ' selected' : ''}" data-id="${goal.id}">
                    ${goal.image_url ? `<img class="record-thumb" src="${goal.image_url}" />` : `<div class="record-thumb"></div>`}
                    <div class="record-detail">
                      <div class="record-date">${goal.date}</div>
                      <div class="record-title">${goal.goal_title}</div>
                      <div class="record-content-title">${goal.content || ''}</div>
                      <div class="record-content-body">${goal.content || ''}</div>
                    </div>
                  </div>
                `).join(""))
          }
        </div>
        <button class="post-add-submit-btn" ${!selectedGoalProgressId ? "disabled" : ""}>게시하기</button>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  main.querySelectorAll('.post-add-cat-btn').forEach(btn => {
    btn.onclick = () => {
      selectedCategory = btn.dataset.cat;
      selectedChallengeId = null;
      selectedGoalProgressId = null;
      renderPostAddPage();
    };
  });

  const selectBox = main.querySelector('#challenge-select');
  if (selectBox) {
    selectBox.addEventListener('change', () => {
      selectedChallengeId = selectBox.value || null;
      selectedGoalProgressId = null;
      renderPostAddPage();
    });
  }

  main.querySelectorAll('.challenge-record-card').forEach(card => {
    card.onclick = () => {
      selectedGoalProgressId = card.dataset.id;
      renderPostAddPage();
    };
  });

  const submitBtn = main.querySelector('.post-add-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = () => {
      if (!selectedGoalProgressId) return;

      fetch("/community/create/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCSRFToken(),
        },
        body: new URLSearchParams({ goal_progress: selectedGoalProgressId })
      })
        .then(res => {
          if (!res.ok) throw new Error("전송 실패");
          alert("게시글이 등록되었습니다!");
          location.href = "/community/";
        })
        .catch(err => {
          console.error(err);
          alert("오류가 발생했습니다.");
        });
    };
  }
}
