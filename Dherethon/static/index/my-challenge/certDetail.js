window.renderCertDetail = function(certId) {
  // === (1) 인증 데이터 로딩 ===
  const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
  const cert = certRecords.find(r => String(r.id) === String(certId));
  if (!cert) {
    alert("인증 기록을 찾을 수 없습니다.");
    return;
  }

  // === (2) DOM 요소 바인딩 ===
  const thumb      = document.querySelector('.cert-detail-thumb');
  const date       = document.querySelector('.cert-detail-date');
  const title      = document.querySelector('.cert-detail-title');
  const desc       = document.querySelector('.cert-detail-desc');
  const cat        = document.querySelector('.challenge-category');
  const challTitle = document.querySelector('.detail-title'); 
  const memo       = document.querySelector('.cert-detail-memo');

  if (thumb)      thumb.style.background = cert.imgDataUrl ? `url('${cert.imgDataUrl}') center/cover no-repeat` : '#ededf1';
  if (date)       date.textContent       = cert.date    || '';
  if (title)      title.textContent      = cert.title   || '';
  if (desc)       desc.textContent       = cert.content || '';
  if (cat)        cat.textContent        = cert.challengeCategory || cert.category || '';
  if (challTitle) challTitle.textContent = cert.challengeTitle || ''; 
  if (memo) {
    const goalText = cert.goal ? cert.goal : '';
    const memoText = cert.memo ? ` (메모: ${cert.memo})` : '';
    memo.textContent = goalText + memoText;
  }

  // === (3) 닫기 버튼 ===
  const closeBtn = document.getElementById('certDetailCloseBtn');
  if (closeBtn) {
    closeBtn.onclick = function() {
      const { pageName, detailKey } = window.getPrevPage?.() || {};
      if (pageName) {
        window.loadPage(pageName, detailKey);
      } else {
        window.loadPage('challengeDetail', cert.challengeId);
      }
    };
  }  

  // === (4) 수정 버튼 ===
  const editBtn = document.getElementById('certEditBtn');
  if (editBtn) {
    editBtn.onclick = function() {
      if (window.loadPage) window.loadPage('certAdd', cert.id);
    };
  }

  // === (5) 삭제 버튼 → 모달 열기 ===
  const deleteBtn = document.getElementById('certDeleteBtn');
  if (deleteBtn) {
    deleteBtn.onclick = function() {
      document.getElementById('certModalCategory').textContent = cert.challengeCategory || cert.category || "";
      document.getElementById('certModalTitle').textContent    = cert.challengeTitle    || "";
      document.getElementById('certDeleteModal').style.display = 'flex';
    };
  }

  // === (6) 모달 내 [아니요] / [예] 버튼 처리 ===
  const modalNo  = document.getElementById('certModalDeleteNo');
  const modalYes = document.getElementById('certModalDeleteYes');

  if (modalNo) {
    modalNo.onclick = function() {
      document.getElementById('certDeleteModal').style.display = 'none';
    };
  }

  if (modalYes) {
    modalYes.onclick = function () {
      // 1. 인증글 삭제
      let certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
      certRecords = certRecords.filter(r => String(r.id) !== String(cert.id));
      localStorage.setItem('certRecords', JSON.stringify(certRecords));

      // 2. 커뮤니티 게시글 연동 삭제
      let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
      posts = posts.filter(p => String(p.certId) !== String(cert.id));
      localStorage.setItem('communityPosts', JSON.stringify(posts));

      // 3. 마무리
      document.getElementById('certDeleteModal').style.display = 'none';
      alert('인증글이 삭제되었습니다.');
      if (window.loadPage) window.loadPage('challengeDetail', cert.challengeId);
    };
  }
};
