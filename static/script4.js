async function generateLayout() {
    const width = document.getElementById("roof-width").value;
    const length = document.getElementById("roof-length").value;
    let numPanels = document.getElementById("num-panels").value;
    const panelWidth = document.getElementById("panel-width").value;
    const panelLength = document.getElementById("panel-length").value;
    const centerAlign = document.getElementById("center-align").checked;
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = "";
    console.log("📥 กดปุ่มแล้ว เริ่มการประมวลผล...");
    console.log("🌞 ข้อมูลที่กรอก:");
    console.log(`- Roof Width: ${width} m`);
    console.log(`- Roof Length: ${length} m`);
    console.log(`- Number of Panels: ${numPanels}`);
    console.log(`- Panel Width: ${panelWidth} m`);
    console.log(`- Panel Length: ${panelLength} m`);
    console.log(`- Center Align: ${centerAlign}`);

    if (!numPanels || isNaN(numPanels) || numPanels <= 0) {
        errorMessage.textContent = "กรุณากรอกจำนวนแผงที่ต้องการเป็นตัวเลขที่ถูกต้อง";
        return;
    }

    if (!Number.isInteger(parseFloat(numPanels))) {
        errorMessage.textContent = "กรุณาใส่จำนวนแผงเป็นจำนวนเต็มเท่านั้น";
        return;
    }

    if (!panelWidth || !panelLength || panelWidth <= 0 || panelLength <= 0) {
        errorMessage.textContent = "กรุณากรอกขนาดแผงให้ถูกต้อง";
        return;
    }

    numPanels = Math.floor(parseFloat(numPanels));

    try {
        const response = await fetch("/Solarpanel/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                width,
                length,
                numPanels,
                centerAlign,
                panelWidth,
                panelLength
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ ข้อผิดพลาดจากเซิร์ฟเวอร์:", data.error);
            errorMessage.textContent = data.error || "เกิดข้อผิดพลาดในการประมวลผล";
            return;
        }

        console.log("✅ ผลลัพธ์จาก server:", data);

        const layoutImage = document.getElementById("layout-image");
        layoutImage.src = `data:image/png;base64,${data.plot_url}`;
        layoutImage.style.display = "block";

        const summary = document.getElementById("summary");

        let railSummaryHTML = "<ul>";
        if (data.rail_summary) {
            for (const [railSize, count] of Object.entries(data.rail_summary)) {
                railSummaryHTML += `<li>รางขนาด ${railSize} เมตร: ${count} เส้น</li>`;
            }
        }
        railSummaryHTML += "</ul>";

        summary.innerHTML = `
            <p><strong>จำนวนแผงทั้งหมด:</strong> ${data.total_panels}</p>
            <p><strong>รายละเอียดรางที่ใช้:</strong></p>
            ${railSummaryHTML}
            <p><strong>จำนวนตัวต่อรางทั้งหมด:</strong> ${data.rail_connector_count} ตัว</p>
            <p><strong>จำนวน End Clamp ทั้งหมด:</strong> ${data.end_clamp_count} ตัว</p>
            <p><strong>จำนวน Middle Clamp ทั้งหมด:</strong> ${data.middle_clamp_count} ตัว</p>
        `;
    } catch (error) {
        console.error("❌ Error ในการเชื่อมต่อ:", error);
        errorMessage.textContent = `เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"}`;
    }
}

function resetForm() {
    console.log("🔄 รีเซ็ตฟอร์มแล้ว");

    document.getElementById("roof-width").value = "";
    document.getElementById("roof-length").value = "";
    document.getElementById("panel-width").value = "";
    document.getElementById("panel-length").value = "";
    document.getElementById("num-panels").value = "";
    document.getElementById("center-align").checked = false;

    document.getElementById("error-message").textContent = "";
    document.getElementById("layout-image").style.display = "none";
    document.getElementById("layout-image").src = "";
    document.getElementById("summary").innerHTML = "";
}


