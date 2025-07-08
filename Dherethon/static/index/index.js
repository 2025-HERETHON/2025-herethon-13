// --- SPA: 페이지 이름-경로 매핑 ---
const PAGE_CONFIG = {
  home: { html: "home/home.html", js: "home/home.js" },
  myChallenge: { html: "my-challenge/myChallenge.html", js: "my-challenge/myChallenge.js" },
  challengeAdd: { html: "my-challenge/challengeAdd.html", js: "my-challenge/challengeAdd.js" },
  challengeDetail: { html: "my-challenge/challengeDetail.html", js: "my-challenge/challengeDetail.js" },
  certAdd: { html: "my-challenge/certAdd.html", js: "my-challenge/certAdd.js" },
  certDetail: { html: "my-challenge/certDetail.html", js: "my-challenge/certDetail.js" },
  community: { html: "community/community.html", js: "" }, // 경로 주의!
  badge: { html: "badge.html", js: "" }
};

// --- 상세/수정/등록 전역 저장용 ---
let currentDetailTitle = null;
let currentCertId = null;
let currentChallengeAddId = null;
let currentCertAddId = null;

// --- SPA 메인 로더 함수 ---
async function loadPage(pageName, detailKey) {
  const { html: htmlPath, js: jsPath } = PAGE_CONFIG[pageName] || PAGE_CONFIG["home"];
  try {
    const res = await fetch(htmlPath);
    if (!res.ok) throw new Error();
    const html = await res.text();
    document.getElementById("mainArea").innerHTML = html;
  } catch (e) {
    document.getElementById("mainArea").innerHTML = "<div style='padding:32px;'>페이지가 없습니다.</div>";
    return;
  }

  // --- detailKey 등 상태 저장 ---
  if (pageName === "challengeDetail" && detailKey) {
    currentDetailTitle = detailKey;
    currentCertId = null;
    currentChallengeAddId = null;
    currentCertAddId = null;
  } else if (pageName === "certDetail" && detailKey) {
    currentCertId = detailKey;
    currentDetailTitle = null;
    currentChallengeAddId = null;
    currentCertAddId = null;
  } else if (pageName === "challengeAdd" && detailKey) {
    currentChallengeAddId = detailKey;
    currentDetailTitle = null;
    currentCertId = null;
    currentCertAddId = null;
  } else if (pageName === "certAdd" && detailKey) {
    currentCertAddId = detailKey;
    currentDetailTitle = null;
    currentCertId = null;
    currentChallengeAddId = null;
  } else {
    currentDetailTitle = null;
    currentCertId = null;
    currentChallengeAddId = null;
    currentCertAddId = null;
  }

  // --- 이전 동적 JS 제거 ---
  const prev = document.getElementById("dynamic-page-script");
  if (prev) prev.remove();

  // --- JS 파일 동적 로드 & 콜백 ---
  if (jsPath) {
    const script = document.createElement("script");
    script.src = jsPath;
    script.id = "dynamic-page-script";
    script.onload = () => {
      if (window.renderLists) window.renderLists();
      if (window.renderChallengeAdd && pageName === "challengeAdd") {
        window.renderChallengeAdd(currentChallengeAddId);
      }
      if (window.renderChallengeDetail && pageName === "challengeDetail") {
        window.renderChallengeDetail(currentDetailTitle);
      }
      if (window.renderCertAdd && pageName === "certAdd") {
        window.renderCertAdd(currentCertAddId);
      }
      if (window.renderCertDetail && pageName === "certDetail") {
        window.renderCertDetail(currentCertId);
      }
    };
    document.body.appendChild(script);
  }
}

// --- 전역 getter 등록 (다른 JS에서 쓸 수 있게) ---
window.currentDetailTitle = () => currentDetailTitle;
window.currentCertId = () => currentCertId;
window.currentChallengeAddId = () => currentChallengeAddId;
window.currentCertAddId = () => currentCertAddId;

// --- 사이드바 버튼 이벤트 등록 ---
document.querySelectorAll(".sideBar_Box").forEach(btn => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".sideBar_Box").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    // data-page 속성 기준으로 이동
    loadPage(this.dataset.page);
  });
});

// --- SPA 페이지 이동 함수 전역 등록 ---
window.loadPage = loadPage;

// --- 최초 진입시 home 페이지 로드 ---
window.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
});
