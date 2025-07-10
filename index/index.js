// --- SPA: 페이지 이름-경로 매핑 ---
const PAGE_CONFIG = {
  home: { html: "home/home.html", js: "home/home.js" },
  mypage: { html: "mypage/mypage.html", js: "mypage/mypage.js" },
  myChallenge: { html: "my-challenge/myChallenge.html", js: "my-challenge/myChallenge.js" },
  challengeAdd: { html: "my-challenge/challengeAdd.html", js: "my-challenge/challengeAdd.js" },
  challengeDetail: { html: "my-challenge/challengeDetail.html", js: "my-challenge/challengeDetail.js" },
  certAdd: { html: "my-challenge/certAdd.html", js: "my-challenge/certAdd.js" },
  certDetail: { html: "my-challenge/certDetail.html", js: "my-challenge/certDetail.js" },
  community: { html: "community/community.html", js: "community/community.js" },
  communityDetail: { html: "community/communityDetail.html", js: "community/communityDetail.js" },
  postAdd: { html: "community/postAdd.html", js: "community/postAdd.js" },
  badge: { html: "badge/badge.html", js: "badge/badge.js" },
  tree: { html: "badge/tree.html", js: "badge/tree.js" }

};

// --- 상세/수정/등록 전역 저장용 ---
let currentDetailTitle = null;
let currentCertId = null;
let currentChallengeAddId = null;
let currentCertAddId = null;

// --- [추가] 이전 페이지 저장용 ---
let prevPageName = null;
let prevDetailKey = null;
window.getPrevPage = () => ({ pageName: prevPageName, detailKey: prevDetailKey });

// --- SPA 메인 로더 함수 ---
async function loadPage(pageName, detailKey) {
  const { html: htmlPath, js: jsPath } = PAGE_CONFIG[pageName] || PAGE_CONFIG["home"];

  // --- [추가] 이전 페이지 정보 저장 ---
  if (window.currentPageName) {
    prevPageName = window.currentPageName;
    prevDetailKey = window.currentDetailKey;
  }
  window.currentPageName = pageName;
  window.currentDetailKey = detailKey;

  // (1) HTML 로드
  let html;
  try {
    const res = await fetch(htmlPath);
    if (!res.ok) throw new Error();
    html = await res.text();
  } catch {
    document.getElementById("mainArea").innerHTML =
      "<div style='padding:32px;'>페이지가 없습니다.</div>";
    return;
  }
  document.getElementById("mainArea").innerHTML = html;

  // (2) 상태 저장
  currentDetailTitle = pageName === "challengeDetail" ? detailKey : null;
  currentCertId = pageName === "certDetail" ? detailKey : null;
  currentChallengeAddId = pageName === "challengeAdd" ? detailKey : null;
  currentCertAddId = pageName === "certAdd" ? detailKey : null;

  // (3) 이전 동적 JS 제거
  const prevScript = document.getElementById("dynamic-page-script");
  if (prevScript) prevScript.remove();

  // (4) JS 파일 동적 로드
  if (jsPath) {
    const script = document.createElement("script");
    script.src = jsPath;
    script.id = "dynamic-page-script";
    script.onload = () => {
      if (pageName === "community" && typeof window.init === "function") {
        window.init();
      } else if (typeof window.renderLists === "function") {
        window.renderLists();
      }

      if (pageName === "communityDetail" && typeof window.renderCommunityDetail === "function") {
        window.renderCommunityDetail(detailKey);
      }
      if (pageName === "postAdd" && typeof window.renderPostAdd === "function") {
        window.renderPostAdd(detailKey);
      }
      if (pageName === "mypage" && typeof window.renderMyPage === "function") {
        window.renderMyPage();
      }
      if (pageName === "challengeAdd" && typeof window.renderChallengeAdd === "function") {
        window.renderChallengeAdd(currentChallengeAddId);
      }
      if (pageName === "challengeDetail" && typeof window.renderChallengeDetail === "function") {
        window.renderChallengeDetail(currentDetailTitle);
      }
      if (pageName === "certAdd" && typeof window.renderCertAdd === "function") {
        window.renderCertAdd(currentCertAddId);
      }
      if (pageName === "certDetail" && typeof window.renderCertDetail === "function") {
        window.renderCertDetail(currentCertId);
      }
    };
    document.body.appendChild(script);
  }
}

// --- 전역 getter & loadPage 등록 ---
window.loadPage = loadPage;
window.currentDetailTitle = () => currentDetailTitle;
window.currentCertId = () => currentCertId;
window.currentChallengeAddId = () => currentChallengeAddId;
window.currentCertAddId = () => currentCertAddId;

// --- 사이드바 버튼 이벤트 등록 ---
document.querySelectorAll(".sideBar_Box").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sideBar_Box")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadPage(btn.dataset.page);
  });
});

// --- 최초 진입시 home 페이지 로드 ---
window.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
});