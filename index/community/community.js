(function() {
  window.selectedCategory = null;
  // 전역 검색어
  window.searchQuery = '';

  // 카테고리별 포스트 개수 업데이트
  window.updateCategoryCounts = function() {
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    document.querySelectorAll('.category-item').forEach(item => {
      const textNode = Array.from(item.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      const catName = textNode
        ? textNode.textContent.trim()
        : item.textContent.replace(/\d+\s*Posts?/, '').trim();
      let filtered = posts.filter(p => p.category === catName);
      // 검색어 필터
      if (window.searchQuery) {
        filtered = filtered.filter(
          p => p.challengeTitle && p.challengeTitle.includes(window.searchQuery)
        );
      }
      const count = filtered.length;
      let span = item.querySelector('.category-count');
      if (!span) {
        span = document.createElement('span');
        span.className = 'category-count';
        item.appendChild(span);
      }
      span.textContent = ` ${count} Posts`;
    });
  };

  // 검색 입력 설정
  window.setupSearchInput = function() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', e => {
      window.searchQuery = e.target.value.trim();
      window.renderLists();
      window.renderPopularPosts();
      window.updateCategoryCounts();
    });
  };

  // 카테고리 클릭 시 필터링 및 UI 업데이트
  window.setupCategoryClickers = function() {
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i =>
          i.classList.remove('selected')
        );
        item.classList.add('selected');
        const textNode = Array.from(item.childNodes).find(
          n => n.nodeType === Node.TEXT_NODE
        );
        window.selectedCategory = textNode
          ? textNode.textContent.trim()
          : item.textContent.replace(/\d+\s*Posts?/, '').trim();
        window.renderLists();
        window.renderPopularPosts();
      });
    });
  };

  // 게시글 리스트 렌더링
  window.renderLists = function() {
    let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    // 카테고리 필터
    if (window.selectedCategory) {
      posts = posts.filter(p => p.category === window.selectedCategory);
    }
    // 검색어 필터
    if (window.searchQuery) {
      posts = posts.filter(
        p => p.challengeTitle && p.challengeTitle.includes(window.searchQuery)
      );
    }
    // 최신순 정렬
    posts.sort((a, b) => b.id - a.id);

    const postListWrap = document.querySelector('.post-list-wrap');
    if (!postListWrap) return;
    postListWrap.innerHTML = '';

    if (posts.length === 0) {
      postListWrap.innerHTML = `
        <div style="color:#aaa;padding:70px 0 0 0;text-align:center;font-size:18px;">
          검색 결과가 없습니다.<br>다른 키워드로 검색해보세요!
        </div>
      `;
      return;
    }

    posts.forEach(post => {
      const thumbStyle = post.imgDataUrl
        ? `background:url('${post.imgDataUrl}') center/cover no-repeat;`
        : '';
      postListWrap.innerHTML += `
        <div class="post-card" data-post-id="${post.id}" style="cursor:pointer;">
          <div class="post-thumb-area">
            <div class="post-thumb" style="${thumbStyle}"></div>
            <div class="post-like-badge">
              ${post.writer || '익명'} | <span class="like-heart">♡</span> ${
        post.like ?? 0
      }
            </div>
          </div>
          <div class="post-content-area">
            <div class="challenge-name">${
        post.challengeTitle || '도전'
      }</div>
            <div class="post-title">${post.title || ''}</div>
          </div>
        </div>
      `;
    });

    postListWrap.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => {
        window.loadPage('communityDetail', card.getAttribute('data-post-id'));
      });
    });
  };

  // 인기 포스트 렌더링 (하트 수 내림차순)
  window.renderPopularPosts = function() {
    let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    // 검색어 필터
    if (window.searchQuery) {
      posts = posts.filter(
        p => p.challengeTitle && p.challengeTitle.includes(window.searchQuery)
      );
    }
    // 카테고리 필터
    if (window.selectedCategory) {
      posts = posts.filter(p => p.category === window.selectedCategory);
    }
    const sorted = posts
      .slice()
      .sort((a, b) => (b.like || 0) - (a.like || 0));

    const popularList = document.querySelector('.popular-post-list');
    if (!popularList) return;
    popularList.innerHTML = '';

    sorted.slice(0, 3).forEach(post => {
      const thumbStyle = post.imgDataUrl
        ? `background:url('${post.imgDataUrl}') center/cover no-repeat;`
        : '';
      popularList.innerHTML += `
        <div class="popular-post-item" data-post-id="${post.id}" style="cursor:pointer;">
          <div class="popular-post-thumb" style="${thumbStyle}"></div>
          <div class="popular-post-content">
            <div class="popular-post-title">${post.title || ''}</div>
            <div class="popular-post-desc">${post.challengeTitle || ''}</div>
          </div>
          <div class="popular-post-like">
            <span class="like-icon">♡</span>
            <span class="like-count">${post.like || 0}</span>
          </div>
        </div>
      `;
    });

    popularList.querySelectorAll('.popular-post-item').forEach(item => {
      item.addEventListener('click', () => {
        window.loadPage('communityDetail', item.getAttribute('data-post-id'));
      });
    });
  };

  // 게시글 작성 버튼 이벤트 설정
  window.setupPostAddButton = function() {
    const postAddBtn = document.querySelector('.post-add-btn');
    if (postAddBtn) {
      postAddBtn.addEventListener('click', () => {
        window.loadPage('postAdd');
      });
    }
  };

  // 초기화
  function init() {
    updateCategoryCounts();
    setupCategoryClickers();
    setupSearchInput();
    renderLists();
    renderPopularPosts();
    setupPostAddButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();