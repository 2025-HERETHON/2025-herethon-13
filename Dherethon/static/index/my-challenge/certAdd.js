window.renderCertAdd = function(certIdOrChallengeId) {
  // 1. 인증글(수정)인지 신규등록(도전id)인지 구분
  const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
  const editingCert = certRecords.find(r => String(r.id) === String(certIdOrChallengeId));
  let challenge = null;
  let editMode = false;
  let challengeId = null;

  if (editingCert) {
    // 인증글 수정모드
    editMode = true;
    challengeId = editingCert.challengeId;
    const challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
    challenge = challenges.find(ch => String(ch.id) === String(challengeId));
  } else {
    // 신규등록 (도전id)
    editMode = false;
    challengeId = certIdOrChallengeId;
    const challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
    challenge = challenges.find(ch => String(ch.id) === String(challengeId));
  }

  // 2. DOM 요소 가져오기 
  const imgInput   = document.getElementById('certAddImg');
  const imgLabel   = document.getElementById('certAddImgLabel');
  const imgPreview = document.getElementById('certAddImgPreviewArea');
  const titleInput   = document.getElementById('certAddInputTitle');
  const contentInput = document.getElementById('certAddContent');
  const dateInput    = document.getElementById('certAddDate');
  const categorySpan = document.querySelector('.cert-add-category');
  const challengeTitleSpan = document.querySelector('.cert-add-title');
  const goalSelect   = document.getElementById('certAddGoal');
  const registerBtn  = document.getElementById('certAddSubmitBtn');
  const closeBtn     = document.getElementById('certAddCloseBtn');
  const memoInput    = document.getElementById('certAddMemo'); // (있으면)

  let imgDataUrl = "";

  // 3. 카테고리, 타이틀 렌더링 
  if (challenge) {
    if (categorySpan)      categorySpan.textContent = challenge.category || '';
    if (challengeTitleSpan) challengeTitleSpan.textContent = challenge.title || '';
  } else if (editingCert) {
    if (categorySpan)      categorySpan.textContent = editingCert.challengeCategory || editingCert.category || '';
    if (challengeTitleSpan) challengeTitleSpan.textContent = editingCert.challengeTitle || '';
  }

  // 4. 세부 목표 드롭다운 생성 
  if (goalSelect) {
    goalSelect.innerHTML = "";
    const goals = challenge?.goals || [];
    if (goals.length === 0) {
      // 세부목표 없음
      let opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "세부 목표 없음";
      goalSelect.appendChild(opt);
    } else {
      // 세부목표 옵션 추가
      goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal;
        option.textContent = goal;
        if (editMode && editingCert && editingCert.goal === goal) {
          option.selected = true;
        }
        goalSelect.appendChild(option);
      });
    }
  }

  // 5. 날짜 입력 
  if (dateInput) {
    if (editMode && editingCert && editingCert.date) {
      dateInput.value = editingCert.date;
    } else {
      dateInput.value = new Date().toISOString().slice(0, 10); // 오늘 날짜
    }
  }

  // 6. 이미지 미리보기 처리
  if (editMode && editingCert && editingCert.imgDataUrl && imgLabel) {
    imgDataUrl = editingCert.imgDataUrl;
    imgLabel.style.backgroundImage = `url('${imgDataUrl}')`;
    imgLabel.style.backgroundSize = 'cover';
    imgLabel.style.backgroundPosition = 'center';
    imgLabel.style.backgroundRepeat = 'no-repeat';
    imgLabel.style.border = 'none';
    if (imgPreview) imgPreview.style.display = 'none';
  }
  // 이미지 업로드시 미리보기 처리
  if (imgInput && imgLabel) {
    imgInput.onchange = function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          imgDataUrl = ev.target.result;
          imgLabel.style.backgroundImage = `url('${imgDataUrl}')`;
          imgLabel.style.backgroundSize = 'cover';
          imgLabel.style.backgroundPosition = 'center';
          imgLabel.style.backgroundRepeat = 'no-repeat';
          imgLabel.style.border = 'none';
          if (imgPreview) imgPreview.style.display = 'none';
        }
        reader.readAsDataURL(file);
      }
    };
  }

  // 7. 제목, 내용, 메모 값 세팅
  if (editMode && editingCert) {
    if (titleInput)   titleInput.value   = editingCert.title   || '';
    if (contentInput) contentInput.value = editingCert.content || '';
    if (memoInput)    memoInput.value    = editingCert.memo    || '';
  } else {
    if (titleInput)   titleInput.value   = '';
    if (contentInput) contentInput.value = '';
    if (memoInput)    memoInput.value    = '';
  }

  // 8. 등록/수정 버튼 클릭 이벤트
  if (registerBtn) {
    registerBtn.onclick = function (e) {
      e.preventDefault();

      // 입력 값 수집
      const title   = titleInput?.value.trim()   || '';
      const content = contentInput?.value.trim() || '';
      const date    = dateInput?.value           || '';
      const goal    = goalSelect?.value          || '';
      const memo    = memoInput?.value.trim()    || '';
      const challengeId   = challenge?.id || editingCert?.challengeId;
      const challengeTitle = challenge?.title || editingCert?.challengeTitle || '';
      const challengeCategory = challenge?.category || editingCert?.challengeCategory || '';

      let certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');

      //  유효성 검사 
      if (!title) {
        alert('인증 제목을 입력해주세요.');
        return;
      }
      if (!goal || goal === "세부 목표 없음") {
        alert('세부 목표를 선택해주세요.');
        return;
      }

      if (editMode && editingCert) {
        // 인증글 수정 
        const idx = certRecords.findIndex(r => String(r.id) === String(certIdOrChallengeId));
        if (idx !== -1) {
          certRecords[idx] = {
            ...certRecords[idx],
            title,
            content,
            date,
            memo,
            goal,
            imgDataUrl,
            challengeId,
            challengeTitle,
            challengeCategory
          };
        }
        alert('인증글이 수정되었습니다!');
      } else {
        // 인증글 신규 등록 
        let newCert = {
          id: Date.now(),
          challengeId,
          challengeTitle,
          challengeCategory,
          goal,
          date,
          title,
          content,
          memo,
          imgDataUrl
        };
        certRecords.push(newCert);
        alert('인증글이 등록되었습니다!');
      }

      localStorage.setItem('certRecords', JSON.stringify(certRecords));
      // 저장 후 페이지 이동
      if (window.loadPage) {
        if (editMode && editingCert) {
          window.loadPage('certDetail', certIdOrChallengeId);
        } else {
          if (challengeId) window.loadPage('challengeDetail', challengeId);
          else window.loadPage('myChallenge');
        }
      }
    };
  }

  // 9. 닫기 버튼 이벤트
  if (closeBtn) {
    closeBtn.onclick = function () {
      const challengeId = challenge?.id || editingCert?.challengeId;
      if (window.loadPage) {
        if (challengeId) window.loadPage('challengeDetail', challengeId);
        else window.loadPage('myChallenge');
      }
    };
  }
};
