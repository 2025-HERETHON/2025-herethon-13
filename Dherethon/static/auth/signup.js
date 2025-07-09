const mailInput = document.querySelector("#mail");
const nameInput = document.querySelector("#name");
const pwInput = document.querySelector("#pw");
const conPwInput = document.querySelector("#conPw");
const message = document.querySelector("#confirm");
const joinBtn = document.querySelector("#joinBtn");

//로그인창으로 이동
function goLogin() {
    location.href = "login.html";
}

//비밀번호 일치 확인
function checkInputs() {
    const pw = pwInput.value.trim();
    const conPw = conPwInput.value.trim();

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
    const name = nameInput.value.trim();
    const mail = mailInput.value.trim();
    const pw = pwInput.value.trim();
    const conPw = conPwInput.value.trim();

    joinBtn.classList.remove("active", "false");

    if (mail !== "" && name !== "" && pw !== "" && message.classList.contains("success")) {
        joinBtn.classList.add("active");
    } else {
        joinBtn.classList.add("false");
    }
}

// active 클래스가 있을 때만 goLogin() 호출
joinBtn.addEventListener("click", () => {
    if (joinBtn.classList.contains("active")) {
        goLogin();
    }
});

// 입력할 때마다 검사되게 = input에 글자 입력하면 checkInput 함수 실행
mailInput.addEventListener("input", btnCheck);
nameInput.addEventListener("input", btnCheck);
pwInput.addEventListener("input", () => {
    btnCheck();
    checkInputs();
});
conPwInput.addEventListener("input", checkInputs);

//파일 업로드 시 사진 미리보기 제공
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        document.getElementById('preview').src = "../assets/previewImg.svg";
    }
}

// ------- 카테고리 선택 -------
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = function () {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    }
});
