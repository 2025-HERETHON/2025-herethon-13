document.addEventListener('DOMContentLoaded', function () {
    const addBtn = document.getElementById('add-goal-btn');
    const container = document.getElementById('goal-container');

    addBtn.addEventListener('click', function () {
        const newWrapper = document.createElement('div');
        newWrapper.classList.add('goal-input-wrapper');

        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'goals';
        input.placeholder = '세부 목표를 입력해주세요.';
        input.classList.add('goal-input');

        newWrapper.appendChild(input);
        container.appendChild(newWrapper);
    });
});
