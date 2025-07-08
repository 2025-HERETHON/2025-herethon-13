document.addEventListener("DOMContentLoaded", () => {
    const mailInput = document.querySelector("#mail");
    const nameInput = document.querySelector("#name");
    const pwInput = document.querySelector("#id_password1");
    const conPwInput = document.querySelector("#id_password2");
    const message = document.querySelector("#confirm");
    const joinBtn = document.querySelector("#joinBtn");
    const categoryInput = document.getElementById("selected-category");

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

    // 전체 입력 유효성 검사
    function btnCheck() {
        const name = nameInput?.value.trim();
        const mail = mailInput?.value.trim();
        const pw = pwInput?.value.trim();
        const category = categoryInput?.value.trim();

        joinBtn.classList.remove("active", "false");

        if (mail && name && pw && message.classList.contains("success") && category) {
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
        btn.addEventListener("click", function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            categoryInput.value = this.dataset.value;
            btnCheck(); // 버튼 활성화 재확인
        });
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
    window.readURL = function (input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('preview').src = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            document.getElementById('preview').src = "../assets/previewImg.svg";
        }
    };
});


