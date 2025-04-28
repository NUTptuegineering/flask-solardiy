function toggleInputFields() {
    let type = document.getElementById("reduce_type").value;
    document.getElementById("unit_input").style.display = type === "unit" ? "block" : "none";
    document.getElementById("money_input").style.display = type === "money" ? "block" : "none";
}

function toggleHistoryInputs() {
    let checkbox = document.getElementById("enable_history");
    let historySection = document.getElementById("history_section");

    if (checkbox.checked || checkbox.hasAttribute("checked")) { // ✅ ตรวจสอบว่ามีค่า checked หรือไม่
        historySection.style.display = "block";
    } else {
        historySection.style.display = "none";
        document.getElementById("month_inputs").innerHTML = "";
    }
    updateMonthInputs(); // ✅ อัปเดตช่องย้อนหลัง
}

function updateMonthInputs() {
    const checkbox = document.getElementById("enable_history");
    const inputContainer = document.getElementById("month_inputs");
    const currentMonth = parseInt(document.getElementById("current_month").value);
    const monthCount = parseInt(document.getElementById("month_count").value);

    inputContainer.innerHTML = ""; // ✅ ล้างค่าก่อนสร้างใหม่

    if (!checkbox.checked) return;

    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

        for (let i = 1; i <= monthCount; i++) {
            let monthIndex = (currentMonth - i - 1 + 12) % 12;
        
            const wrapper = document.createElement("div");
            wrapper.className = "col-6";
        
            const row = document.createElement("div");
            row.className = "row align-items-center mb-2";
        
            const labelCol = document.createElement("div");
            labelCol.className = "col-4 text-end fw-semibold";
            labelCol.innerText = monthNames[monthIndex];
        
            const inputCol = document.createElement("div");
            inputCol.className = "col-8";
        
            const input = document.createElement("input");
            input.type = "number";
            input.name = `month${i}`;
            input.min = 0;
            input.required = checkbox.checked;
            input.className = "form-control";
        
            // ✅ ดึงค่าเก่าจาก previousUnits
            if (previousUnits.length >= i) {
                input.value = previousUnits[i-1];
            }
        
            inputCol.appendChild(input);
            row.appendChild(labelCol);
            row.appendChild(inputCol);
            wrapper.appendChild(row);
            inputContainer.appendChild(wrapper);
        }
        
        
}

function showResetButton() {
    document.getElementById("resetFormButton").style.display = "block";
}

document.getElementById("electricityForm").addEventListener("submit", function (event) {
    showResetButton();       // ✅ แสดงปุ่มรีเซ็ตข้อมูล
});


function resetForm_cal() {
    document.getElementById("electricityForm").reset(); // ✅ รีเซ็ตฟอร์ม

    // ✅ ล้างค่าผลลัพธ์ที่แสดง
    const results = document.getElementById("results");
    const reducedResults = document.getElementById("reduced_results");
    if (results) results.innerHTML = "";
    if (reducedResults) reducedResults.innerHTML = "";

    // ✅ รีเซ็ตข้อมูลย้อนหลัง
    document.getElementById("month_inputs").innerHTML = "";

    // ✅ รีเซ็ต checkbox การใช้ย้อนหลัง
    const historyCheckbox = document.getElementById("enable_history");
    historyCheckbox.checked = false;
    historyCheckbox.removeAttribute("checked");

    // ✅ รีเซ็ต dropdown ลดค่าไฟ
    document.getElementById("reduce_type").value = "";
    toggleInputFields();

    // ✅ ซ่อน input ลดค่าไฟ
    document.getElementById("unit_input").style.display = "none";
    document.getElementById("money_input").style.display = "none";

    // ✅ อัปเดต UI ที่เกี่ยวข้อง
    toggleHistoryInputs();

    // ✅ ซ่อนปุ่ม "รีเซ็ตข้อมูล" อีกครั้ง
    document.getElementById("resetFormButton").style.display = "none";
}



document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("enable_history").addEventListener("change", toggleHistoryInputs);
    document.getElementById("month_count").addEventListener("change", updateMonthInputs);
    document.getElementById("current_month").addEventListener("change", updateMonthInputs);
    document.getElementById("reduce_type").addEventListener("change", toggleInputFields);

    // ✅ รอให้ DOM เสถียรก่อนแล้วค่อย toggle
    setTimeout(() => {
        toggleHistoryInputs();
        updateMonthInputs();
        toggleInputFields();
    }, 10);

    // ✅ แสดงปุ่มรีเซ็ตถ้ามีผลลัพธ์
    if ((document.getElementById("results") && document.getElementById("results").innerHTML.trim() !== "") ||
        (document.getElementById("reduced_results") && document.getElementById("reduced_results").innerHTML.trim() !== "")) {
        document.getElementById("resetFormButton").style.display = "block";
    }
});

function resetForm() {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?')) {
        window.location.href = "/Cal_electric_price/reset";  // ✅ ตรงนี้พิมพ์ path ให้ตรงกับ server
    }
}







