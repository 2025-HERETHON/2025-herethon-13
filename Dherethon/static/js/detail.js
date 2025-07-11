const checkedUrl = "/static/assets/Checked Checkbox1.svg";
const uncheckedUrl = "/static/assets/Checked Checkbox.svg";

// 공용 모달
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// CSRF 토큰 가져오기
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 상세페이지 렌더 함수
window.renderChallengeDetail = function () {
    const challenge = window.challengeData;
    if (!challenge) {
        alert("도전 데이터를 불러올 수 없습니다.");
        return;
    }

    // ===== 썸네일/기본 정보 =====
    const thumb = document.querySelector('.challenge-detail-thumb');
    if (thumb) {
        if (challenge.imageUrl) {
            thumb.style.background = `url('${challenge.imageUrl}') center/cover no-repeat`;
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
    const completedList = document.getElementById('completedGoalList');
    completedList.innerHTML = '';
    challenge.completedGoals.forEach(goal => {
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
    if (challenge.ongoingGoals.length > 0) {
        challenge.ongoingGoals.forEach(goal => {
            inprogressList.innerHTML += `
                <li>
                    <span class="goal-checkbox-static">
                        <img src="${uncheckedUrl}" alt="체크박스 해제" width="24" height="24" />
                    </span>
                    <span class="goal-text-box inprogress">${goal}</span>
                </li>`;
        });
    } else {
        inprogressList.innerHTML = '<li><span style="color:#aaa;">세부 목표가 없습니다.</span></li>';
    }

    // ===== 진행률 =====
    const percent = challenge.progress || 0;
    document.querySelector('.challenge-detail-progress-label').textContent =
        `진행률 ${percent}% (${challenge.completedCount}/${challenge.totalGoals})`;
    document.getElementById('progressBar').style.width = percent + "%";

    // 진행률 100%이면 뱃지 모달 열기
    if (challenge.progress === 100 && !challenge.badgeReceived) {
        document.getElementById('badgeModalCategory').textContent = challenge.category;
        document.getElementById('badgeModalTitle').textContent = challenge.title;
        openModal("badgeModal");
    }
};

// 인증기록 렌더
function renderCertRecordsByDate(dateStr) {
    const recordList = document.getElementById('recordList');
    recordList.innerHTML = '';

    fetch(`/challenges/challenge/${window.challengeData.id}/records/?date=${dateStr}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.records.length === 0) {
                recordList.innerHTML = '<div style="color:#aaa; padding:24px 0;">해당 날짜의 인증글이 없습니다.</div>';
            } else {
                data.records.forEach((record) => {
                    recordList.innerHTML += `
                        <div class="challenge-record-card" style="cursor: pointer;" onclick="window.location.href='/challenges/record/${record.id}/';">
                            <div class="record-thumb" style="background:#e9e9e9; width:44px; height:44px; border-radius:10px;"></div>
                            <div class="record-detail">
                                <div class="record-date">${record.date.replaceAll('-', '.')}.</div>
                                <div class="record-title">${record.goal}</div>
                                <div class="record-content">
                                    <span class="record-content-title">${record.title}</span><br>
                                    <span class="record-content-body">${record.content}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });

            }
        })
        .catch((err) => {
            recordList.innerHTML = '<div style="color:#aaa; padding:24px 0;">데이터를 불러오는 중 오류 발생</div>';
            console.error(err);
        });
}

// 달력 렌더
function renderCalendar(year, month, selectedDateStr = null) {
    const calendarContainer = document.getElementById("calendarGrid");
    const calendarTitle = document.getElementById("calendarYearMonth");

    fetch(`/challenges/challenge/${window.challengeData.id}/records/dates/?year=${year}&month=${month}`)
        .then((res) => res.json())
        .then((data) => {
            const certDates = data.cert_dates || [];

            calendarTitle.textContent = `${year} ${String(month).padStart(2, '0')}`;
            calendarContainer.innerHTML = "";

            const firstDay = new Date(year, month - 1, 1).getDay();
            const lastDate = new Date(year, month, 0).getDate();
            const prevLastDate = new Date(year, month - 1, 0).getDate();

            const todayStr = new Date().toISOString().slice(0, 10);
            const activeDateStr = selectedDateStr || todayStr;

            ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
                calendarContainer.innerHTML += `<div class="calendar-day-header">${day}</div>`;
            });

            for (let i = 0; i < firstDay; i++) {
                calendarContainer.innerHTML += `<div class="calendar-day other-month"><span class="calendar-day-inner">${prevLastDate - firstDay + i + 1}</span></div>`;
            }

            for (let d = 1; d <= lastDate; d++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                let classes = "calendar-day";
                if (dateStr === activeDateStr) classes += " active";
                if (certDates.includes(dateStr)) classes += " completed";

                let dot = certDates.includes(dateStr) ? `<div class="calendar-dot"></div>` : "";
                calendarContainer.innerHTML += `
                    <div class="${classes}" data-date="${dateStr}">
                        <span class="calendar-day-inner">${dot}${d}</span>
                    </div>
                `;
            }

            const totalCells = firstDay + lastDate;
            const afterDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
            for (let i = 1; i <= afterDays; i++) {
                calendarContainer.innerHTML += `<div class="calendar-day other-month"><span class="calendar-day-inner">${i}</span></div>`;
            }

            calendarContainer.querySelectorAll('.calendar-day').forEach(day => {
                if (!day.classList.contains('other-month')) {
                    day.onclick = function () {
                        const dateStr = this.getAttribute('data-date');
                        renderCalendar(year, month, dateStr);
                        renderCertRecordsByDate(dateStr);
                    };
                }
            });
        });
}

// 실행 트리거
document.addEventListener("DOMContentLoaded", function () {
    if (window.challengeData) {
        window.renderChallengeDetail();

        const today = new Date();
        renderCalendar(today.getFullYear(), today.getMonth() + 1);
        renderCertRecordsByDate(today.toISOString().slice(0, 10));
    }

    document.getElementById('editBtn')?.addEventListener('click', () => {
        window.location.href = `/challenges/challenge/${window.challengeData.id}/edit/`;
    });

    document.getElementById('certBtn')?.addEventListener('click', () => {
        window.location.href = `/challenges/challenge/${window.challengeData.id}/goals/create/`;
    });

    document.getElementById('globalCloseBtn')?.addEventListener('click', () => {
        window.location.href = `/challenges/`;
    });

    document.querySelector(".calendar-prev-btn")?.addEventListener("click", () => {
        const current = document.getElementById("calendarYearMonth").textContent.split(" ");
        let year = parseInt(current[0]);
        let month = parseInt(current[1]);
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
        renderCalendar(year, month);
        renderCertRecordsByDate();
    });

    document.querySelector(".calendar-next-btn")?.addEventListener("click", () => {
        const current = document.getElementById("calendarYearMonth").textContent.split(" ");
        let year = parseInt(current[0]);
        let month = parseInt(current[1]);
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
        renderCalendar(year, month);
        renderCertRecordsByDate();
    });

    // ===== 삭제 모달 바인딩 =====
    document.getElementById('deleteBtn')?.addEventListener('click', () => {
        document.getElementById('modalCategory').textContent = window.challengeData.category;
        document.getElementById('modalTitle').textContent = window.challengeData.title;
        openModal("deleteModal");
    });

    document.getElementById('modalDeleteNo')?.addEventListener('click', () => {
        closeModal("deleteModal");
    });

    document.getElementById('modalDeleteYes')?.addEventListener('click', () => {
        fetch(`/challenges/challenge/delete/${window.challengeData.id}`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
        .then((response) => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                alert("삭제에 실패했습니다.");
            }
        })
        .catch((error) => {
            console.error("삭제 실패:", error);
            alert("서버 오류로 삭제하지 못했습니다.");
        });
    });

    document.getElementById("badgeModalYes")?.addEventListener("click", () => {
        fetch(`/challenges/${window.challengeData.id}/complete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                alert("도전 완료 처리에 실패했습니다.");
            }
        })
        .catch(err => {
            console.error("도전 완료 실패:", err);
            alert("서버 오류가 발생했습니다.");
        });
    });

    document.getElementById("badgeModalNo")?.addEventListener("click", () => {
        closeModal("badgeModal");
    });

});
