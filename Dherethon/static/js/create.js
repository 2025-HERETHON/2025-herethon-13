document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("add-goal-btn").addEventListener("click", function () {
        const container = document.getElementById("goal-container");

        const newInputWrapper = document.createElement("div");
        newInputWrapper.className = "goal-input-wrapper";

        newInputWrapper.innerHTML = `
            <input type="text" name="goals" placeholder="세부 목표를 입력해주세요." class="goal-input">
        `;

        container.appendChild(newInputWrapper);
    });
});
