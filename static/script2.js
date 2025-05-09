function toggleInputFields() {
    let type = document.getElementById("reduce_type").value;
    document.getElementById("unit_input").style.display = type === "unit" ? "block" : "none";
    document.getElementById("money_input").style.display = type === "money" ? "block" : "none";
}

function toggleHistoryInputs() {
    let checkbox = document.getElementById("enable_history");
    let historySection = document.getElementById("history_section");

    if (checkbox.checked || checkbox.hasAttribute("checked")) {
        historySection.style.display = "block";
    } else {
        historySection.style.display = "none";
        document.getElementById("month_inputs").innerHTML = "";
    }
    updateMonthInputs();
}

function updateMonthInputs() {
    const checkbox = document.getElementById("enable_history");
    const inputContainer = document.getElementById("month_inputs");
    const currentMonth = parseInt(document.getElementById("current_month").value);
    const monthCount = parseInt(document.getElementById("month_count").value);

    inputContainer.innerHTML = "";

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
    showResetButton();
});

function resetForm_cal() {
    document.getElementById("electricityForm").reset();

    const results = document.getElementById("results");
    const reducedResults = document.getElementById("reduced_results");
    if (results) results.innerHTML = "";
    if (reducedResults) reducedResults.innerHTML = "";

    document.getElementById("month_inputs").innerHTML = "";

    const historyCheckbox = document.getElementById("enable_history");
    historyCheckbox.checked = false;
    historyCheckbox.removeAttribute("checked");

    document.getElementById("reduce_type").value = "";
    toggleInputFields();

    document.getElementById("unit_input").style.display = "none";
    document.getElementById("money_input").style.display = "none";

    toggleHistoryInputs();

    document.getElementById("resetFormButton").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("enable_history").addEventListener("change", toggleHistoryInputs);
    document.getElementById("month_count").addEventListener("change", updateMonthInputs);
    document.getElementById("current_month").addEventListener("change", updateMonthInputs);
    document.getElementById("reduce_type").addEventListener("change", toggleInputFields);

    setTimeout(() => {
        toggleHistoryInputs();
        updateMonthInputs();
        toggleInputFields();
    }, 10);

    if ((document.getElementById("results") && document.getElementById("results").innerHTML.trim() !== "") ||
        (document.getElementById("reduced_results") && document.getElementById("reduced_results").innerHTML.trim() !== "")) {
        document.getElementById("resetFormButton").style.display = "block";
    }
});

function resetForm() {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?')) {
        window.location.href = "/Cal_electric_price/reset";
    }
}