
// ✅ postId는 템플릿에서 전역 변수로 주입됨
window.renderCommunityDetail = function (post) {
  const postId = post.id;

  let container = document.querySelector('.community-detail-content-layout');
  if (!container) {
    const main = document.getElementById('mainArea') || document.querySelector('.main-content');
    if (!main) return;
    main.innerHTML = '';
    container = document.createElement('div');
    container.className = 'community-detail-content-layout';
    main.appendChild(container);
  }

  post.like = typeof post.like === 'number' ? post.like : 0;
  post.liked = typeof post.liked === 'boolean' ? post.liked : false;
  const goalText = post.detailGoal || '';

  container.innerHTML = `
    <div class="detail-main">
      ${post.isMine ? `
  <form method="POST" action="/community/post/${post.id}/delete/" id="deleteForm">
    <input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
    <button type="submit" class="detail-delete-btn">삭제하기</button>
  </form>
` : ''}

      <div class="detail-thumbnail" style="${
        post.imgDataUrl ? `background:url('${post.imgDataUrl}') center/cover no-repeat; background-size:cover;` : ''
      }"></div>
      <div class="detail-info-block">
        <div class="detail-like-fixed">
          <div class="like like-button${post.liked ? ' liked' : ''}">
              <div class="like-icon" style="
                  background-image: url('${post.liked ? heartFullSvg : heartSvg}');
                  z-index: 10;
                  position: relative;
                  height: 20px;
                  background-size: cover;
              "></div>
            <span class="like-count">${post.like}</span>
          </div>
          <div class="detail-meta-date">${post.date || ''}</div>
        </div>
        <div class="detail-row">
          <div class="profile-image">
            <img src="${post.user && post.user.profile_image ? post.user.profile_image : '/static/images/default_profile.png'}" 
                alt="프로필 이미지" 
                style="width:37px; height:37px; border-radius:50%;" />
          </div>
          <span class="writer">${post.writer || '익명'}</span>
          <div class="category-challenge-block">
            <span class="category">${post.category || ''}</span>
            <span class="challenge-title">${post.challengeTitle || ''}</span>
          </div>
          ${goalText ? `<span class="badge">${goalText}</span>` : ''}
        </div>
        <div class="detail-title">${post.title || ''}</div>
        <div class="detail-content">${post.content || ''}</div>
      </div>
    </div>
    <aside class="detail-comments">
      <button class="detail-close-btn" id="communityDetailCloseBtn" aria-label="닫기">
        <img src="/static/assets/Cancel.svg" alt="닫기" />
      </button>
      <div class="comment-list">
        ${(post.comments || []).map(c => `
          <div class="comment-item">
            <div class="comment-profile"></div>
            <div class="comment-right">
              <div class="comment-header">
                <span class="comment-writer">${c.writer}</span>
                <span class="comment-date">${c.date}</span>
              </div>
              <div class="comment-content">${c.text}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="comment-input-row">
        <input class="comment-input" type="text" placeholder="댓글을 입력하세요" />
        <button class="comment-send-btn" aria-label="댓글 전송">⤴</button>
      </div>
    </aside>
  `;

  const inputEl = container.querySelector('.comment-input');
  const sendBtn = container.querySelector('.comment-send-btn');
  const closeBtn = container.querySelector('#communityDetailCloseBtn');

  closeBtn.onclick = () => {
    window.location.href = "/community/";
  };

  const likeBtn = container.querySelector('.like-button');
  const icon = likeBtn.querySelector('.like-icon');
  const countEl = container.querySelector('.like-count');

  likeBtn.onclick = () => {
    fetch(`/community/${post.id}/like/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
    })
      .then(res => res.json())
      .then(data => {
        post.liked = data.liked;
        post.like = data.like_count;
        likeBtn.classList.toggle('liked', data.liked);
        icon.style.backgroundImage = `url('${post.liked ? heartFullSvg : heartSvg}')`;
        countEl.textContent = data.like_count;
      })
      .catch(err => {
        console.error(err);
        alert("좋아요 처리 중 오류가 발생했어요!");
      });
  };

  function getCSRFToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  }

  sendBtn.onclick = () => {
    const text = inputEl.value.trim();
    if (!text) return;

    fetch(`/community/${post.id}/comment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': getCSRFToken(),
      },
      body: new URLSearchParams({ content: text })
    })
      .then(res => {
        if (!res.ok) throw new Error("댓글 등록 실패");
        return fetch(`/community/api/post/${post.id}/`);
      })
      .then(res => res.json())
      .then(updatedPost => {
        renderCommunityDetail(updatedPost);
      })
      .catch(err => {
        console.error(err);
        alert("댓글 등록 중 오류가 발생했어요.");
      });
  };
};

document.addEventListener("DOMContentLoaded", () => {
  if (typeof postId !== 'undefined') {
    fetch(`/community/api/post/${postId}/`)
      .then(res => res.json())
      .then(post => {
        renderCommunityDetail(post);
      })
      .catch(err => {
        console.error("인증글 로딩 실패:", err);
      });
  }
});