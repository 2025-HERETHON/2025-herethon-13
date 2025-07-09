const checkedUrl = "../../assets/Checked Checkbox1.svg";
const uncheckedUrl = "../../assets/Checked Checkbox.svg";

// 공용 모달 열기/닫기 함수
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 상세페이지 렌더 함수
window.renderChallengeDetail = function (challengeKey) {
  const data = JSON.parse(localStorage.getItem('challenges') || '[]');
  let challenge = data.find(ch =>
    String(ch.id) === String(challengeKey) || ch.title === challengeKey
  );
  if (!challenge) {
    alert("해당 도전 정보를 찾을 수 없습니다.");
    return;
  }

  // ===== 썸네일/기본 정보 =====
  const thumb = document.querySelector('.challenge-detail-thumb');
  if (thumb) {
    if (challenge.imgDataUrl) {
      thumb.style.background = `url('${challenge.imgDataUrl}') center/cover no-repeat`;
    } else {
      thumb.style.background = "#e9e9e9";
    }
    thumb.style.borderRadius = "12px";
    thumb.style.width = "260px";
    thumb.style.height = "260px";
  }
  document.querySelector('.challenge-detail-category').textContent = challenge.category || "";
  document.querySelector('.challenge-detail-title').textContent = challenge.title || "";
  document.querySelector('.challenge-detail-date').textContent =
    challenge.startDate && challenge.endDate ? `${challenge.startDate} - ${challenge.endDate}` : "";
  document.querySelector('.challenge-detail-public').textContent = challenge.isPublic ? "공개" : "비공개";

  // ===== D+N, D-M =====
  if (challenge.startDate && challenge.endDate) {
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const dPlus = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const dMinus = Math.floor((end - now) / (1000 * 60 * 60 * 24));
    const ddayEls = document.querySelectorAll('.challenge-detail-dday');
    if (ddayEls.length >= 2) {
      ddayEls[0].textContent = `이 도전을 시작한 지 D+${dPlus}`;
      ddayEls[1].textContent = dMinus >= 0 ? `종료까지 D-${dMinus}` : `종료된 도전입니다`;
    }
  }

  // ===== 세부 목표 =====
  function renderGoals() {
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const myCerts = certRecords.filter(r => String(r.challengeId) === String(challenge.id));
    const completedGoals = (challenge.goals || []).filter(goal =>
      myCerts.some(cert => cert.goal === goal)
    );
    const inprogressGoals = (challenge.goals || []).filter(goal =>
      !completedGoals.includes(goal)
    );

    const completedList = document.getElementById('completedGoalList');
    completedList.innerHTML = '';
    completedGoals.forEach(goal => {
      completedList.innerHTML += `
        <li>
          <span class="goal-checkbox-static">
            <img src="${checkedUrl}" alt="체크 아이콘" width="24" height="24" />
          </span>
          <span class="goal-text-box">${goal}</span>
        </li>`;
    });

    const inprogressList = document.getElementById('inprogressGoalList');
    inprogressList.innerHTML = '';
    if (inprogressGoals.length > 0) {
      inprogressGoals.forEach(goal => {
        inprogressList.innerHTML += `
          <li>
            <span class="goal-checkbox-static">
              <img src="${uncheckedUrl}" alt="체크박스 해제" width="24" height="24" />
            </span>
            <span class="goal-text-box inprogress">${goal}</span>
          </li>`;
      });
    } else if ((challenge.goals || []).length === 0) {
      inprogressList.innerHTML = '<li><span style="color:#aaa;">세부 목표가 없습니다.</span></li>';
    }
  }

  // ===== 진행률 =====
  function updateProgressUI() {
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const myCerts = certRecords.filter(r => String(r.challengeId) === String(challenge.id));
    const total = (challenge.goals || []).length;
    const done = (challenge.goals || []).filter(goal =>
      myCerts.some(cert => cert.goal === goal)
    ).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    document.querySelector('.challenge-detail-progress-label').textContent = `진행률 ${percent}% (${done}/${total})`;
    document.getElementById('progressBar').style.width = percent + "%";

    if (percent === 100 && !window._badgeModalShown) {
      window._badgeModalShown = true;
      document.getElementById('badgeModalCategory').textContent = challenge.category || "";
      document.getElementById('badgeModalTitle').textContent = challenge.title || "";
      openModal('badgeModal');
    } else if (percent < 100) {
      window._badgeModalShown = false;
    }
  }

  // ===== 인증 기록 카드 =====
  function renderCertRecords(filterDate) {
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const myCerts = certRecords
      .filter(r => String(r.challengeId) === String(challenge.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const recordList = document.getElementById('recordList');
    recordList.innerHTML = '';
    const certsToShow = filterDate ? myCerts.filter(cert => cert.date === filterDate) : myCerts;

    if (certsToShow.length === 0) {
      recordList.innerHTML = '<div style="color:#aaa; padding:24px 0;">아직 인증 기록이 없습니다.</div>';
      return;
    }

    certsToShow.forEach(cert => {
      recordList.innerHTML += `
        <div class="challenge-record-card" data-cert-id="${cert.id}">
          <div class="record-thumb" style="${cert.imgDataUrl
          ? `background:url('${cert.imgDataUrl}') center/cover no-repeat;`
          : `background:#e9e9e9;`
        }border-radius:10px;width:44px;height:44px;"></div>
          <div class="record-detail">
            <div class="record-date">${cert.date.replaceAll('-', '.')}.</div>
            <div class="record-title">${cert.goal}</div>
            <div class="record-content">
              <span class="record-content-title">${cert.title}</span><br>
              <span class="record-content-body">${cert.content}</span>
            </div>
          </div>
        </div>
      `;
    });

    recordList.querySelectorAll('.challenge-record-card').forEach(card => {
      card.onclick = function () {
        const certId = this.getAttribute('data-cert-id');
        if (window.loadPage) window.loadPage('certDetail', certId);
      };
    });
  }

  // ===== 달력 =====
  function renderCalendar(year, month, selectedDateStr) {
    const calendarContainer = document.querySelector('.calendar-grid');
    const calendarHeader = document.querySelector('.calendar-header span');
    if (!calendarContainer || !calendarHeader) return;
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const myCerts = certRecords.filter(r => String(r.challengeId) === String(challenge.id));
    const certDates = myCerts.map(cert => cert.date);

    calendarHeader.textContent = `${year} ${month.toString().padStart(2, '0')}`;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const prevLastDate = new Date(year, month - 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeDateStr = selectedDateStr || todayStr;

    let html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="calendar-day other-month"><span class="calendar-day-inner">${prevLastDate - firstDay + i + 1}</span></div>`;
    }

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let classes = "calendar-day";
      if (dateStr === activeDateStr) classes += " active";
      if (certDates.includes(dateStr)) classes += " completed";
      let dot = certDates.includes(dateStr) ? `<div class="calendar-dot"></div>` : "";
      html += `
        <div class="${classes}" data-date="${dateStr}">
          <span class="calendar-day-inner">${dot}${d}</span>
        </div>
      `;
    }

    const afterDays = (firstDay + lastDate) % 7 === 0 ? 0 : 7 - ((firstDay + lastDate) % 7);
    for (let i = 1; i <= afterDays; i++) {
      html += `<div class="calendar-day other-month"><span class="calendar-day-inner">${i}</span></div>`;
    }

    calendarContainer.innerHTML = html;

    calendarContainer.querySelectorAll('.calendar-day').forEach(day => {
      if (!day.classList.contains('other-month')) {
        day.onclick = function () {
          const dateStr = this.getAttribute('data-date');
          renderCalendar(year, month, dateStr);
          renderCertRecords(dateStr);
        };
      }
    });

    document.querySelector('.calendar-prev-btn').onclick = function () {
      let newY = month === 1 ? year - 1 : year;
      let newM = month === 1 ? 12 : month - 1;
      renderCalendar(newY, newM, null);
      renderCertRecords();
    };
    document.querySelector('.calendar-next-btn').onclick = function () {
      let newY = month === 12 ? year + 1 : year;
      let newM = month === 12 ? 1 : month + 1;
      renderCalendar(newY, newM, null);
      renderCertRecords();
    };
  }

  // ===== 초기 실행 =====
  const now = new Date();
  renderGoals();
  updateProgressUI();
  renderCertRecords(now.toISOString().slice(0, 10));
  renderCalendar(now.getFullYear(), now.getMonth() + 1, now.toISOString().slice(0, 10));

  // ===== 버튼 바인딩 =====
  document.getElementById('editBtn').onclick = () => window.loadPage && window.loadPage('challengeAdd', challenge.id);
  document.getElementById('certBtn').onclick = () => window.loadPage && window.loadPage('certAdd', challenge.id);
  document.getElementById('globalCloseBtn').onclick = () => {
    const { pageName, detailKey } = window.getPrevPage?.() || {};
    if (pageName) {
      window.loadPage(pageName, detailKey);
    } else {
      window.loadPage('myChallenge');
    }
  };


  document.getElementById('deleteBtn').onclick = function () {
    document.getElementById('modalCategory').textContent = challenge.category || "";
    document.getElementById('modalTitle').textContent = challenge.title || "";
    openModal('deleteModal');
  };
  document.getElementById('modalDeleteNo').onclick = () => closeModal('deleteModal');

  document.getElementById('modalDeleteYes').onclick = function () {
    // 1. 도전 삭제
    let challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
    challenges = challenges.filter(ch => String(ch.id) !== String(challenge.id));
    localStorage.setItem('challenges', JSON.stringify(challenges));

    // 2. 인증글 삭제 + certId 추출
    let certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const deletedCertIds = certRecords
      .filter(r => String(r.challengeId) === String(challenge.id))
      .map(r => r.id);
    certRecords = certRecords.filter(r => String(r.challengeId) !== String(challenge.id));
    localStorage.setItem('certRecords', JSON.stringify(certRecords));

    // 3. 커뮤니티 게시글 삭제
    let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    posts = posts.filter(p => !deletedCertIds.includes(p.certId));
    localStorage.setItem('communityPosts', JSON.stringify(posts));
    //4. 뱃지 삭제
    let badgeList = JSON.parse(localStorage.getItem('badgeList') || '[]');
    badgeList = badgeList.filter(b => String(b.challengeId) !== String(challenge.id));
    localStorage.setItem('badgeList', JSON.stringify(badgeList));

    closeModal('deleteModal');
    alert('도전이 삭제되었습니다.');
    if (window.loadPage) window.loadPage('myChallenge');
  };

  // === 도전 완료 뱃지 모달 버튼 ===
  document.getElementById('badgeModalYes').onclick = function () {
    closeModal('badgeModal');
    alert('도전 완료 뱃지가 발급되었습니다!');
    //뱃지 지급
    // 기존 뱃지 리스트 불러오기 (없으면 빈 배열)
    let badgeList = JSON.parse(localStorage.getItem("badgeList") || "[]");

    //  이미 이 도전의 뱃지가 저장돼있는지 확인
    const exists = badgeList.some(b => String(b.challengeId) === String(challenge.id));

    //  없으면 추가
    if (!exists) {
      badgeList.push({
        challengeId: challenge.id,
        category: challenge.category,
        title: challenge.title,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
      });

      //  다시 저장
      localStorage.setItem("badgeList", JSON.stringify(badgeList));
    }
  }
  document.getElementById('badgeModalNo').onclick = function () {
    closeModal('badgeModal');
  };
};
