window.renderCertDetail = function(certId) {
    // === (1) 인증 데이터 로딩 ===
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const cert = certRecords.find(r => String(r.id) === String(certId));
    if (!cert) {
      alert("인증 기록을 찾을 수 없습니다.");
      return;
    }
  
    // === (2) DOM 요소 바인딩 ===
    const thumb      = document.querySelector('.cert-detail-thumb');     // 썸네일
    const date       = document.querySelector('.cert-detail-date');      // 날짜
    const title      = document.querySelector('.cert-detail-title');     // 인증 제목
    const desc       = document.querySelector('.cert-detail-desc');      // 인증 내용
    const cat        = document.querySelector('.challenge-category');    // 챌린지 카테고리
    const challTitle = document.querySelector('.challenge-title');       // 챌린지명
    const memo       = document.querySelector('.cert-detail-memo');      // 메모
  
    // 썸네일/기본 정보 세팅
    if (thumb)      thumb.style.background = cert.imgDataUrl ? `url('${cert.imgDataUrl}') center/cover no-repeat` : '#ededf1';
    if (date)       date.textContent       = cert.date    || '';
    if (title)      title.textContent      = cert.title   || '';
    if (desc)       desc.textContent       = cert.content || '';
    if (cat)        cat.textContent        = cert.challengeCategory || cert.category || '';
    if (challTitle) challTitle.textContent = cert.challengeTitle    || '';
    if (memo)       memo.textContent       = cert.memo    || '';
  
    // === (3) 닫기 버튼 이벤트 연결 ===
    const closeBtn = document.getElementById('certDetailCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        if (window.loadPage) window.loadPage('challengeDetail', cert.challengeId);
      };
    }
  
    // === (4) 수정 버튼 이벤트 연결 ===
    const editBtn = document.getElementById('certEditBtn');
    if (editBtn) {
      editBtn.onclick = function() {
        if (window.loadPage) window.loadPage('certAdd', cert.id);
      };
    }
  
    // === (5) 삭제 버튼 클릭 → 삭제 모달 오픈 ===
    const deleteBtn = document.getElementById('certDeleteBtn');
    if (deleteBtn) {
      deleteBtn.onclick = function() {
        document.getElementById('certModalCategory').textContent = cert.challengeCategory || cert.category || "";
        document.getElementById('certModalTitle').textContent    = cert.challengeTitle    || "";
        document.getElementById('certDeleteModal').style.display = 'flex';
      };
    }
  
    // === (6) 삭제 모달 내 [아니요]/[예] 버튼 처리 ===
    const modalNo  = document.getElementById('certModalDeleteNo');
    const modalYes = document.getElementById('certModalDeleteYes');
    // 모달 닫기(아니요)
    if (modalNo) {
      modalNo.onclick = function() {
        document.getElementById('certDeleteModal').style.display = 'none';
      };
    }
    // 삭제 확정(예)
    if (modalYes) {
      modalYes.onclick = function() {
        let certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
        certRecords = certRecords.filter(r => String(r.id) !== String(cert.id));
        localStorage.setItem('certRecords', JSON.stringify(certRecords));
        document.getElementById('certDeleteModal').style.display = 'none';
        alert('인증글이 삭제되었습니다.');
        if (window.loadPage) window.loadPage('challengeDetail', cert.challengeId);
      };
    }
  };
  