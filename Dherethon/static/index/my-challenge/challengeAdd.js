// challengeAdd.js - 챌린지 등록/수정 폼 전체 로직
window.renderChallengeAdd = function(challengeId) {
  // ===== (1) 입력 필드 및 상태 변수 정의 =====
  const titleInput = document.querySelector('.challenge-name-input');              // 도전명
  const categoryBtns = document.querySelectorAll('.category-btn');                 // 카테고리 버튼 그룹
  const periodInputs = document.querySelectorAll('.period-input');                 // 기간(시작/끝)
  const isPublicInput = document.querySelector('.switch input');                   // 공개 여부 체크박스
  const certDropdown = document.getElementById('certDropdown');                    // 인증주기 드롭다운
  const goalInput = document.querySelector('.goal-input');                         // 세부목표 입력창
  const goalAddBtn = document.querySelector('.goal-add-btn');                      // 세부목표 추가 버튼
  const goalList = document.querySelector('.goal-list');                           // 세부목표 리스트
  const imgInput = document.getElementById('imgInput');                            // 이미지 업로드 인풋
  const imgPreview = document.getElementById('imgPreview');                        // 이미지 프리뷰 아이콘
  const registerBtn = document.querySelector('.register-btn');                     // 등록(저장) 버튼
  const closeBtn = document.getElementById('challengeAddCloseBtn');                // 닫기(✕) 버튼
  let imgDataUrl = "";
  let editMode = !!challengeId;
  let editingChallenge = null;

  // ===== (2) 수정모드: 기존 데이터 자동 세팅 =====
  if (editMode) {
    const data = JSON.parse(localStorage.getItem('challenges') || '[]');
    editingChallenge = data.find(ch => String(ch.id) === String(challengeId));
    if (editingChallenge) {
      // 기존 도전명
      if (titleInput) titleInput.value = editingChallenge.title || "";
      // 기존 카테고리
      if (categoryBtns) {
        categoryBtns.forEach(btn => {
          if (btn.textContent.trim() === (editingChallenge.category || "")) {
            btn.classList.add('selected');
          } else {
            btn.classList.remove('selected');
          }
        });
      }
      // 기존 기간
      if (periodInputs[0]) periodInputs[0].value = editingChallenge.startDate || "";
      if (periodInputs[1]) periodInputs[1].value = editingChallenge.endDate || "";
      // 기존 공개여부
      if (isPublicInput) isPublicInput.checked = !!editingChallenge.isPublic;
      // 기존 인증주기
      if (certDropdown) {
        const certCycle = editingChallenge.certCycle || "";
        const dropdownList = certDropdown.querySelectorAll('.dropdown-list li');
        dropdownList.forEach(li => {
          if (li.textContent.trim() === certCycle) li.classList.add('selected');
          else li.classList.remove('selected');
        });
        const selectedText = certDropdown.querySelector('.dropdown-selected-text');
        if (selectedText) selectedText.textContent = certCycle || "매일";
      }
      // 기존 세부목표 리스트
      if (goalList) {
        goalList.innerHTML = "";
        (editingChallenge.goals || []).forEach(goal => {
          const li = document.createElement('li');
          const textSpan = document.createElement('span');
          textSpan.className = 'goal-text';
          textSpan.textContent = goal;
          li.appendChild(textSpan);
          const rm = document.createElement('span');
          rm.className = 'remove-goal';
          const rmImg = document.createElement('img');
          rmImg.src = '../assets/close.svg';
          rmImg.alt = '삭제';
          rmImg.style.width = '18px';
          rmImg.style.height = '18px';
          rm.appendChild(rmImg);
          rm.onclick = () => li.remove();
          li.appendChild(rm);
          goalList.appendChild(li);
        });
      }
      // 기존 대표이미지
      if (editingChallenge.imgDataUrl && imgPreview) {
        imgDataUrl = editingChallenge.imgDataUrl;
        const uploadBox = imgPreview.parentNode;
        uploadBox.style.backgroundImage = `url('${imgDataUrl}')`;
        uploadBox.style.backgroundSize = 'cover';
        uploadBox.style.backgroundPosition = 'center';
        uploadBox.style.backgroundRepeat = 'no-repeat';
        uploadBox.style.border = 'none';
        imgPreview.style.display = 'none';
      }
    }
  }

  // ===== (3) 카테고리 선택: 클릭시 토글 =====
  if (categoryBtns) {
    categoryBtns.forEach(btn => {
      btn.onclick = function () {
        categoryBtns.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
      };
    });
  }

  // ===== (4) 대표 이미지 미리보기 (업로드) =====
  if (imgInput && imgPreview) {
    imgInput.onchange = function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          imgDataUrl = ev.target.result;
          imgPreview.style.display = 'none';
          const uploadBox = imgPreview.parentNode;
          uploadBox.style.backgroundImage = `url('${imgDataUrl}')`;
          uploadBox.style.backgroundSize = 'cover';
          uploadBox.style.backgroundPosition = 'center';
          uploadBox.style.backgroundRepeat = 'no-repeat';
          uploadBox.style.border = 'none';
        }
        reader.readAsDataURL(file);
      }
    };
  }

  // ===== (5) 세부목표 추가/삭제 기능 =====
  if (goalInput && goalAddBtn && goalList) {
    goalAddBtn.onclick = function () {
      const value = goalInput.value.trim();
      if (value) {
        const li = document.createElement('li');
        const textSpan = document.createElement('span');
        textSpan.className = 'goal-text';
        textSpan.textContent = value;
        li.appendChild(textSpan);
        const rm = document.createElement('span');
        rm.className = 'remove-goal';
        const rmImg = document.createElement('img');
        rmImg.src = '../../assets/Cancel.svg';
        rmImg.alt = '삭제';
        rmImg.style.width = '18px';
        rmImg.style.height = '18px';
        rm.appendChild(rmImg);
        rm.onclick = () => li.remove();
        li.appendChild(rm);
        goalList.appendChild(li);
        goalInput.value = '';
        goalInput.focus();
      }
    };
    // 엔터키로도 추가
    goalInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') goalAddBtn.click();
    });
  }

  // ===== (6) 등록/수정 버튼: 도전 저장 =====
  if (registerBtn) {
    registerBtn.onclick = function () {
      // 입력값 수집
      const title = titleInput?.value.trim() || '';
      const category = document.querySelector('.category-btn.selected')?.textContent.trim() || '';
      const startDate = periodInputs[0]?.value || '';
      const endDate = periodInputs[1]?.value || '';
      const isPublic = isPublicInput?.checked || false;
      const certSelected = certDropdown?.querySelector('.dropdown-selected-text');
      const certCycle = certSelected ? certSelected.textContent : '';
      // 세부목표 모음
      const goals = [];
      goalList?.querySelectorAll('li .goal-text').forEach(span => {
        goals.push(span.textContent.trim());
      });

      // 입력값 유효성 체크
      if (!title) {
        alert('도전 이름을 입력해주세요.');
        return;
      }

      let prev = JSON.parse(localStorage.getItem('challenges') || '[]');
      if (editMode && editingChallenge) {
        // === 수정모드 ===
        const idx = prev.findIndex(ch => String(ch.id) === String(challengeId));
        if (idx !== -1) {
          prev[idx] = {
            ...prev[idx],
            title, category, startDate, endDate, isPublic, certCycle, goals, imgDataUrl
          };
        }
        alert("도전이 수정되었습니다!");
      } else {
        // === 신규 등록 모드 ===
        const challenge = {
          id: Date.now(),
          title,
          category,
          startDate,
          endDate,
          isPublic,
          certCycle,
          goals,
          imgDataUrl,
          progress: 0
        };
        prev.push(challenge);
        alert("도전이 등록되었습니다!");
      }
      localStorage.setItem('challenges', JSON.stringify(prev));
      // SPA 이동
      if (typeof loadPage === "function") {
        loadPage('myChallenge');
      } else if (window.loadPage) {
        window.loadPage('myChallenge');
      }
    };
  }

  // ===== (8) 닫기(✕) 버튼 이벤트 =====
  if (closeBtn) {
    closeBtn.onclick = function () {
      if (typeof loadPage === "function") {
        loadPage('myChallenge');
      } else if (window.loadPage) {
        window.loadPage('myChallenge');
      }
    };
  }
};
