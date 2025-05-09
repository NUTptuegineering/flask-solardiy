async function generateLayout() {
    const width = document.getElementById("roof-width").value;
    const length = document.getElementById("roof-length").value;
    let numPanels = document.getElementById("num-panels").value;
    const panelWidth = document.getElementById("panel-width").value;
    const panelLength = document.getElementById("panel-length").value;
    const centerAlign = document.getElementById("center-align").checked;
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = "";
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
            body: JSON.stringify({ width, length, numPanels, centerAlign, panelWidth, panelLength }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("❌ ข้อผิดพลาดจากเซิร์ฟเวอร์:", data.error);
            if (data.max_panels !== undefined) {
                errorMessage.textContent = `${data.error} (สามารถวางได้สูงสุด ${data.max_panels} แผง)`;
            } else {
                errorMessage.textContent = data.error || "เกิดข้อผิดพลาดในการประมวลผล";
            }
            return;
        }
        
        if (data.warning) {
            console.log("⚠️ มีคำเตือน: ", data.warning);
        
            const layoutWarning = document.getElementById("layout-warning");
            layoutWarning.textContent = data.warni;
            layoutWarning.style.display = "block";
        
            const offset = 150;
            const topPos = layoutWarning.getBoundingClientRect().top + window.scrollY - offset;
            console.log("🟡 Scroll ไปที่คำเตือน (topPos):", topPos);
            window.scrollTo({ top: topPos, behavior: 'smooth' });
        
        } else {
            console.log("✅ ไม่มีคำเตือน จะแสดง layout และ scroll ไปยัง layout-card");
        
            document.getElementById("layout-warning").style.display = "none";
        
            const layoutImage = document.getElementById('layout-image');
        
            layoutImage.onload = () => {
                console.log("🖼️ layoutImage โหลดเสร็จ → แสดง layout-card & summary แล้ว scroll");
        
                document.getElementById('layout-card').style.display = "block";
                document.getElementById('summary').style.display = "block";
        
                setTimeout(() => {
                    const layoutCard = document.getElementById('layout-card');
                    const offset = 300;
                    const topPos = layoutCard.getBoundingClientRect().top + window.scrollY - offset;
                    console.log("🟢 Scroll ไปยัง layout-card (topPos):", topPos);
                    window.scrollTo({ top: topPos, behavior: 'smooth' });
                }, 100);
            };

            console.log("🔁 รีเซ็ต layoutImage.src แล้ว set ใหม่");
            const uniqueBase64 = `data:image/png;base64,${data.plot_url}?t=${Date.now()}`;
            layoutImage.src = uniqueBase64;
            layoutImage.style.display = 'block';
        }

        const layoutImage = document.getElementById('layout-image');
        layoutImage.src = `data:image/png;base64,${data.plot_url}`;
        layoutImage.style.display = 'block';
        layoutImage.onload = () => {
            document.getElementById('layout-card').style.display = "block";
            document.getElementById('summary').style.display = "block";

            if (!data.warning) {
              document.getElementById('summary').scrollIntoView({ behavior: 'smooth' });
            }
          };          

        const summaryTableBody = document.getElementById('summary-table-body');
        summaryTableBody.innerHTML = '';

        function addRow(label, value) {
            if (value > 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${label}</td>
                    <td>${value}</td>
                `;
                summaryTableBody.appendChild(row);
            }
        }

        addRow('แผงโซลาร์เซลล์', data.total_panels);
        addRow('ตัวต่อราง (Rail Connectors)', data.rail_connector_count);
        addRow('End Clamp', data.end_clamp_count);
        addRow('Middle Clamp', data.middle_clamp_count);

        if (data.rail_summary && Object.keys(data.rail_summary).length) {
            Object.entries(data.rail_summary).forEach(([size, count]) => {
                addRow(`รางขนาด ${size} เมตร`, count);
            });
        }

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

    document.getElementById("summary-table-body").innerHTML = `
        <tr><td colspan="2" class="text-muted">– ยังไม่มีข้อมูล –</td></tr>
    `;
}


