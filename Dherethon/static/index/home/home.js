
(function () {
  // ------ 이미지 스타일 함수 ------
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

  let selectedCategory = "전체"; //드롭박스 카테고리
  let postCategoryFilter = "전체"; //인기포스트 카테고리

  // ------ 도전 리스트 및 사이드 카드 렌더링 ------
  function renderLists() {
    const data = JSON.parse(localStorage.getItem('challenges') || '[]');
    const list = document.querySelector('.challenge-list');
    const sideCards = document.querySelector('.home-side-cards');

    if (!list || !sideCards) return;

    list.innerHTML = '';
    sideCards.innerHTML = '';

    const filtered = selectedCategory === "전체"
      ? data
      : data.filter(ch => ch.category === selectedCategory);

    if (filtered.length === 0) {
      list.innerHTML = `
          <div style="padding:32px;color:#666;font-family:'Segoe UI';font-size:12px;font-weight:600;line-height:15px;">
            해당 카테고리의 도전이 없습니다. 새로운 도전을 추가해보세요!
          </div>`;
    }

    filtered.slice().reverse().forEach(ch => {
      const dDayText = ch.category || '';
      const percent = calcProgress(ch);
      const firstGoal = (ch.remaining_goals && ch.remaining_goals.length > 0)
        ? ch.remaining_goals[0]
        : '다음 세부 목표 없음';
      const iconStyle = makeIconStyle(ch.imgDataUrl);

      const row = document.createElement('div');
      row.className = 'challenge-row';
      row.style.display = 'flex'; // 꼭 필요함
      row.style.alignItems = 'center';
      row.style.padding = '12px 24px';
      row.style.borderBottom = '1px solid #eee';
      row.style.backgroundColor = '#fff';

      row.innerHTML = `
        <div class="challenge-info" style="display:flex; align-items:center; width: 320px;">
          <div class="challenge-icon" style="${iconStyle}"></div>
          <div class="challenge-info-texts" style="margin-left: 12px;">
            <div class="challenge-date" style="font-size: 11px; color: #888;">${dDayText}</div>
            <div class="challenge-title" style="font-size: 14px; font-weight: 600;">${ch.title}</div>
          </div>
        </div>
        <div class="challenge-progress" style="display:flex; flex-direction: column; align-items:flex-start; width: 180px;">
          <span class="progress-percent" style="font-size: 11px; color: #555;">${percent}%</span>
          <div class="progress-bar-bg" style="width:100%; height: 6px; background:#e9e9e9; border-radius: 3px;">
            <div class="progress-bar" style="height:6px; background:#605BFF; border-radius: 3px; width:${percent}%;"></div>
          </div>
        </div>
        <div class="challenge-goal" style="width: 200px; font-size: 13px; color: #333; font-weight: 500;">${firstGoal}</div>
      `;

      row.style.cursor = 'pointer';
      row.onclick = function () {
        window.location.href = `/challenges/detail/${ch.id}/`;
      };
      list.appendChild(row);
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const soonToEnd = filtered
      .filter(ch => ch.endDate)
      .map(ch => {
        const end = new Date(ch.endDate);
        end.setHours(0, 0, 0, 0);
        const remain = Math.max(0, Math.floor((end - now) / (1000 * 60 * 60 * 24)));
        return { ...ch, remain };
      })
      .sort((a, b) => a.remain - b.remain)
      .slice(0, 3);

    if (soonToEnd.length === 0) {
      sideCards.innerHTML = `<div style="padding:20px;color:#aaa;">표시할 도전이 없습니다.</div>`;
      return;
    }

    soonToEnd.forEach(ch => {
      const certImgStyle = makeCertImgStyle(ch.imgDataUrl);
      const div = document.createElement('div');
      div.className = 'home-cert-card';
      div.innerHTML = `
          <div class="home-cert-img" style="${certImgStyle}"></div>
          <div class="home-cert-category">${ch.category}</div>
          <div class="home-cert-title">${ch.title}</div>
          <a href="/challenges/challenge/${ch.id}/goals/create/" class="home-cert-link">인증하러 가기 →</a>

        `;
      sideCards.appendChild(div);

    });
  }

  document.querySelectorAll('.home-category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.home-category-item').forEach(i =>
        i.classList.remove('selected')
      );
      item.classList.add('selected');

      const catText = item.childNodes[0].nodeValue.trim();
      postCategoryFilter = catText;
      renderPopularPosts();
    });
  });

  // ------ 인기 포스트 렌더링 ------
  function renderPopularPosts() {
    const postClassPrefix = 'home-';
    let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');

    const filteredPosts = postCategoryFilter === "전체"
      ? posts
      : posts.filter(p => p.category === postCategoryFilter);

    const sorted = filteredPosts.sort((a, b) => (b.like || 0) - (a.like || 0));

    const popularList = document.querySelector(`.${postClassPrefix}popular-post-list`);
    if (!popularList) return;
    popularList.innerHTML = '';

    sorted.slice(0, 3).forEach(post => {
      const thumbStyle = post.imgDataUrl
        ? `background:url('${post.imgDataUrl}') center/cover no-repeat;`
        : '';

      popularList.innerHTML += `
        <div class="${postClassPrefix}popular-post-item" data-post-id="${post.id}" style="cursor:pointer;">
          <div class="${postClassPrefix}popular-post-thumb" style="${thumbStyle}"></div>
          <div class="${postClassPrefix}popular-post-content">
            <div class="${postClassPrefix}popular-post-title">${post.title || ''}</div>
            <div class="${postClassPrefix}popular-post-desc">${post.challengeTitle || ''}</div>
          </div>
          <div class="${postClassPrefix}popular-post-like">
            <span class="like-icon">♡</span>
            <span class="like-count">${post.like || 0}</span>
          </div>
        </div>
      `;
    });

    popularList.querySelectorAll(`.${postClassPrefix}popular-post-item`).forEach(item => {
      item.addEventListener('click', () => {
        const postId = item.getAttribute('data-post-id');
        window.location.href = `/community/${postId}/`;
      });
    });
  }

  // ------ 카테고리별 글 수 업데이트 ------
  function updateCategoryCounts() {
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    document.querySelectorAll('.home-category-item').forEach(item => {
      const textNode = Array.from(item.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      const catName = textNode
        ? textNode.textContent.trim()
        : item.textContent.replace(/\d+\s*Posts?/, '').trim();

      let filtered = posts.filter(p => p.category === catName);

      const count = filtered.length;

      let span = item.querySelector('.home-category-count');
      if (!span) {
        span = document.createElement('span');
        span.className = 'home-category-count';
        item.appendChild(span);
      }
      span.textContent = `${count} Posts`;
    });
  }

  // ------ 진행률 계산 ------
  function calcProgress(ch) {
    const certRecords = JSON.parse(localStorage.getItem('certRecords') || '[]');
    const myCerts = certRecords.filter(r => String(r.challengeId) === String(ch.id));
    const total = (ch.goals || []).length;
    const done = (ch.goals || []).filter(goal =>
      myCerts.some(cert => cert.goal === goal)
    ).length;
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  // ------ 드롭다운 및 카테고리 이벤트 ------
  const dropdown = document.querySelector('.dropdown');
  const button = dropdown?.querySelector('.dropbtn');
  const buttonText = dropdown?.querySelector('.dropbtn-text');
  const items = dropdown?.querySelectorAll('.dropdown-content li');

  button?.addEventListener('click', () => {
    dropdown.classList.toggle('active');
  });

  items?.forEach(item => {
    item.addEventListener('click', () => {
      selectedCategory = item.dataset.category;
      buttonText.textContent = selectedCategory;
      dropdown.classList.remove('active');
      renderLists();
      renderPopularPosts();
    });
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  document.querySelectorAll('.home-categoryBtn').forEach(btn => {
    btn.onclick = function () {
      document.querySelectorAll('.home-categoryBtn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    };
  });

  const addBtn = document.getElementById('home-addChallengeBtn');
  if (addBtn) {
    addBtn.onclick = function () {
      window.location.href = '/challenges/challenge/create/';
    };
  }
  //랜덤 챌린지 추천
  let currentRecommendedChallenge = window.recommendedChallenge;

  function renderRandomChallenge(challenge) {
    const container = document.querySelector('.home-suggestBox');
    currentRecommendedChallenge = challenge || window.recommendedChallenge;

    // 데이터 없으면 안내문구
    if (!currentRecommendedChallenge) {
      container.innerHTML = `<div style="padding:32px;color:#666;">추천할 도전이 없습니다.</div>`;
      return;
    }

    const { category = '', title = '', goals = [], imgDataUrl, user } = currentRecommendedChallenge;
    let goalsHTML = '';
    if (!goals || goals.length === 0) {
      goalsHTML = `<div class="home-randomDetailGoals">세부 목표가 없습니다.</div>`;
    } else {
      goalsHTML = goals.map(goal => `<div class="home-randomDetailGoals">${goal}</div>`).join('');
    }
    const writerName = user?.nickname || '알 수 없음';

    container.innerHTML = `
      <div class="home-randomChallengeTitle">${writerName}님의 Challenge</div>
      <div class="home-randomCategory">${category}</div>
      <div class="home-randomChallengeTitle">${title}</div>
      <div class="home-randomDetailTitle">세부 목표</div>
      ${goalsHTML}
      <button class="home-randomAddBtn">
        <img class="home-plusImg" src="/static/assets/homePlus.svg" alt="추가" />
        도전 추가하기
      </button>
    `;
  }

  // --- 추천 다시받기 버튼 ---
  document.querySelectorAll('.home-suggestBtn').forEach(btn => {
    btn.onclick = function () {
      fetch('/home/get_random_recommendation/')
        .then(res => res.json())
        .then(data => {
          renderRandomChallenge(data.recommendedChallenge);
        });
    }
  });

  // --- 도전 추가하기 버튼 이벤트 ---
  document.addEventListener('click', function (e) {
    if (e.target.closest('.home-randomAddBtn')) {
      if (!currentRecommendedChallenge || !currentRecommendedChallenge.id) {
        alert('추천 챌린지가 없습니다.');
        return;
      }
      // 바로 도전 복사(추가) 폼으로 이동
      window.location.href = `/copy/${currentRecommendedChallenge.id}/`;
    }
  });

  // ------ 실행 ------
  renderLists();
  renderPopularPosts();
  updateCategoryCounts();
  renderRandomChallenge();

})();


