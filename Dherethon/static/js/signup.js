document.addEventListener("DOMContentLoaded", () => {
    const mailInput = document.querySelector("#mail");
    const nameInput = document.querySelector("#name");
    const pwInput = document.querySelector("#id_password1");
    const conPwInput = document.querySelector("#id_password2");
    const message = document.querySelector("#confirm");
    const joinBtn = document.querySelector("#joinBtn");
    const categoryInput = document.getElementById("selected-category");

    // 중복 확인 함수
    function checkDuplicate(type, value, callback) {
        const url = type === 'username' ? '/api/check-username/' : '/api/check-nickname/';
        fetch(`${url}?${type}=${encodeURIComponent(value)}`)
            .then(response => response.json())
            .then(data => callback(data.exists))
            .catch(() => callback(false));
    }

    // 아이디 중복 확인 버튼
    document.getElementById("check-username-btn")?.addEventListener("click", () => {
        const username = document.querySelector("#id_username").value.trim();
        const message = document.querySelector("#username-message");

        checkDuplicate('username', username, exists => {
            message.classList.remove("success", "error");
            if (exists) {
                message.textContent = "이미 존재하는 아이디입니다.";
                message.classList.add("error");
            } else {
                message.textContent = "사용 가능한 아이디입니다!";
                message.classList.add("success");
            }
        });
    });

    // 닉네임 중복 확인 버튼
    document.getElementById("check-nickname-btn")?.addEventListener("click", () => {
        const nickname = document.querySelector("#id_nickname").value.trim();
        const message = document.querySelector("#nickname-message");

        checkDuplicate('nickname', nickname, exists => {
            message.classList.remove("success", "error");
            if (exists) {
                message.textContent = "이미 존재하는 닉네임입니다.";
                message.classList.add("error");
            } else {
                message.textContent = "사용 가능한 닉네임입니다!";
                message.classList.add("success");
            }
        });
    });

    // 비밀번호 일치 확인
    function checkInputs() {
        const pw = pwInput?.value.trim();
        const conPw = conPwInput?.value.trim();

        message.classList.remove("success", "error");

        if (conPw === pw && pw !== "") {
            message.textContent = "비밀번호가 일치합니다.";
            message.classList.add("success");
        } else {
            message.textContent = "비밀번호가 일치하지 않습니다.";
            message.classList.add("error");
        }
        btnCheck();
    }

    //모두 입력 되었는지 확인 후 회원가입 버튼 활성화
    function btnCheck() {
        const name = nameInput?.value.trim();
        const mail = mailInput?.value.trim();
        const pw = pwInput?.value.trim();

        joinBtn.classList.remove("active", "false");

        if (mail !== "" && name !== "" && pw !== "" && message.classList.contains("success")) {
            joinBtn.classList.add("active");
        } else {
            joinBtn.classList.add("false");
        }
    }

    // 회원가입 버튼 클릭 시 폼 제출
    joinBtn.addEventListener("click", () => {
        if (joinBtn.classList.contains("active")) {
            document.querySelector("form").submit();
        }
    });

    // 실시간 입력 감지
    mailInput?.addEventListener("input", btnCheck);
    nameInput?.addEventListener("input", btnCheck);
    pwInput?.addEventListener("input", () => {
        btnCheck();
        checkInputs();
    });
    conPwInput?.addEventListener("input", checkInputs);

    // 카테고리 버튼 선택
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            // 숨겨진 input에 선택한 값 저장
            document.getElementById('selected-category').value = this.dataset.value;
        };
    });


    // 최초 로드시 선택된 카테고리 반영
    const selected = categoryInput?.value;
    if (selected) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            if (btn.dataset.value === selected) {
                btn.classList.add("selected");
            }
        });
    }

    // 프로필 이미지 미리보기
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                const imageDataUrl = e.target.result;

                document.getElementById('preview').src = imageDataUrl;

                localStorage.setItem('profileImage', imageDataUrl);
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            document.getElementById('preview').src = "../assets/previewImg.svg";
            localStorage.removeItem('profileImage');
        }
    }
});


