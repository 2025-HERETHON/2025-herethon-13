window.renderChallengeAdd = function(challengeId) {
    const titleInput = document.querySelector('.challenge-name-input');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const hiddenCategoryInput = document.getElementById('category-hidden');
    const periodInputs = document.querySelectorAll('.period-input');
    const isPublicInput = document.querySelector('.switch input');
    const goalInput = document.querySelector('.goal-input');
    const goalAddBtn = document.querySelector('.goal-add-btn');
    const goalList = document.querySelector('.goal-list');
    const imgInput = document.getElementById('imgInput');
    const imgPreview = document.getElementById('imgPreview');
    const registerBtn = document.querySelector('.register-btn');
    const closeBtn = document.getElementById('challengeAddCloseBtn');

    let imgDataUrl = "";
    let editMode = !!challengeId;
    let editingChallenge = null;

    // === 수정 모드: 로컬스토리지에서 기존 도전 불러오기 ===
    if (editMode) {
        const data = JSON.parse(localStorage.getItem('challenges') || '[]');
        editingChallenge = data.find(ch => String(ch.id) === String(challengeId));
        if (editingChallenge) {
            if (titleInput) titleInput.value = editingChallenge.title || "";

            if (categoryBtns && hiddenCategoryInput) {
                categoryBtns.forEach(btn => {
                    if (btn.textContent.trim() === editingChallenge.category) {
                        btn.classList.add('selected');
                        hiddenCategoryInput.value = btn.dataset.value;
                    } else {
                        btn.classList.remove('selected');
                    }
                });
            }

            if (periodInputs[0]) periodInputs[0].value = editingChallenge.startDate || "";
            if (periodInputs[1]) periodInputs[1].value = editingChallenge.endDate || "";
            if (isPublicInput) isPublicInput.checked = !!editingChallenge.isPublic;

            if (goalList) {
                goalList.innerHTML = "";
                (editingChallenge.goals || []).forEach(goal => {
                    const li = document.createElement('li');
                    li.className = 'goal-list-item';

                    const textSpan = document.createElement('span');
                    textSpan.className = 'goal-text';
                    textSpan.textContent = goal;

                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'goals';
                    hiddenInput.value = goal;

                    const rm = document.createElement('span');
                    rm.className = 'remove-goal';
                    const rmImg = document.createElement('img');
                    rmImg.src = window.STATIC_URL + "assets/Cancel.svg";
                    rmImg.alt = '삭제';
                    rmImg.style.width = '18px';
                    rmImg.style.height = '18px';
                    rm.appendChild(rmImg);
                    rm.onclick = () => li.remove();

                    li.appendChild(textSpan);
                    li.appendChild(hiddenInput); // ✅ 서버 전송용
                    li.appendChild(rm);

                    goalList.appendChild(li);
                });
            }

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

    // === 카테고리 선택 ===
    if (categoryBtns) {
        categoryBtns.forEach(btn => {
            btn.onclick = function () {
                categoryBtns.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                if (hiddenCategoryInput) {
                    hiddenCategoryInput.value = this.dataset.value;
                }
            };
        });
    }

    // === 이미지 업로드 미리보기 ===
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

    // === 세부목표 추가 ===
    if (goalInput && goalAddBtn && goalList) {
        goalAddBtn.onclick = function () {
            const value = goalInput.value.trim();
            if (value) {
                const li = document.createElement('li');
                li.className = 'goal-list-item';

                const textSpan = document.createElement('span');
                textSpan.className = 'goal-text';
                textSpan.textContent = value;

                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'goals';
                hiddenInput.value = value;

                const rm = document.createElement('span');
                rm.className = 'remove-goal';
                const rmImg = document.createElement('img');
                rmImg.src = window.STATIC_URL + "assets/Cancel.svg";
                rmImg.alt = '삭제';
                rmImg.style.width = '18px';
                rmImg.style.height = '18px';
                rm.appendChild(rmImg);
                rm.onclick = () => li.remove();

                li.appendChild(textSpan);
                li.appendChild(hiddenInput);  // ✅ 추가
                li.appendChild(rm);

                goalList.appendChild(li);
                goalInput.value = '';
                goalInput.focus();
            }
        };

        goalInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                goalAddBtn.click();
            }
        });
    }

    // === 닫기 버튼 처리 ===
    if (closeBtn) {
        closeBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "/challenges/";
        });
    }
};