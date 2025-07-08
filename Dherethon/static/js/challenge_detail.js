document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("record-date-picker");
    const recordListContainer = document.getElementById("record-list");
    const challengeId = datePicker.dataset.challengeId;

    datePicker.addEventListener("change", function () {
        const selectedDate = this.value;

        fetch(`/challenges/${challengeId}/records/?date=${selectedDate}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("데이터를 불러올 수 없습니다.");
                }
                return response.json();
            })
            .then((data) => {
                renderRecords(data.records);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });

    function renderRecords(records) {
        recordListContainer.innerHTML = "";

        if (records.length === 0) {
            recordListContainer.innerHTML = "<li>해당 날짜의 인증글이 없습니다.</li>";
            return;
        }

        records.forEach((record) => {
            const li = document.createElement("li");
            li.style.marginBottom = "16px";
            li.style.border = "1px solid #ccc";
            li.style.borderRadius = "8px";
            li.style.padding = "12px";
            li.style.backgroundColor = "#fef9c3";

            li.innerHTML = `
                <a href="/challenges/record/${record.id}/" style="text-decoration: none; color: inherit;">
                    <div style="display: flex; gap: 16px;">
                        ${
                            record.image_url
                                ? `<img src="${record.image_url}" alt="썸네일" style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px;">`
                                : `<div style="width: 64px; height: 64px; background-color: #ddd; display: flex; align-items: center; justify-content: center; font-size: 12px;">이미지 없음</div>`
                        }
                        <div style="flex: 1;">
                            <p style="font-size: 12px; color: #6b7280; margin: 0;">${record.date}</p>
                            <p style="font-size: 13px; background-color: #fef3c7; display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin: 4px 0;">${record.goal_content}</p>
                            <p style="font-size: 15px; font-weight: bold; margin: 2px 0;">${record.title || '(제목 없음)'}</p>
                            <p style="font-size: 14px; color: #444; margin: 0;">${record.content}</p>
                        </div>
                    </div>
                </a>
            `;
            recordListContainer.appendChild(li);
        });
    }
});
