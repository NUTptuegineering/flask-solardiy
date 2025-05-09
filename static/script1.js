console.log("✅ script1.js loaded");

let rowCounter; // ตัวแปรเก็บลำดับแถว

// ฟังก์ชันโหลดข้อมูลจังหวัด
async function loadProvinces() {
    try {
        const response = await fetch('/static/provinces.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch provinces: ${response.status}`);
        }
        const data = await response.json();

        const datalist = document.getElementById('provinceList');
        datalist.innerHTML = ""; // ล้างค่าเก่าใน datalist

        data.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading provinces:', error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const provinceInput = document.getElementById('province');
    const resetProvinceBtn = document.getElementById('resetProvinceBtn');
    const provinceNotice = document.getElementById('provinceNotice'); // ต้องมี id ให้ span ด้วยนะ

    resetProvinceBtn.addEventListener('click', () => {
        provinceInput.value = '';
        provinceInput.focus();
        if (provinceNotice) {
            provinceNotice.textContent = '';
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    loadProvinces();
    initializeDeviceTable();
    handleSystemTypeChange();
    toggleLoadSection(); // เรียกทันทีตอนโหลด
    handleProvinceNoticeSetup();
    handleResetButtonSetup();

    const offGridRadio = document.getElementById('offGrid');
    const onGridRadio = document.getElementById('onGrid');
    const systemTypeRadios = document.querySelectorAll('input[name="systemType"]');

    systemTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            handleSystemTypeChange();
            toggleLoadSection();
        });
    });

    offGridRadio.addEventListener("change", toggleLoadSection);
    onGridRadio.addEventListener("change", toggleLoadSection);
});

function toggleLoadSection() {
    const loadSection = document.getElementById("loadSection");
    const offGridRadio = document.getElementById("offGrid");
    if (offGridRadio && loadSection) {
        const isOffGrid = offGridRadio.checked;
        console.log("🧪 toggleLoadSection() called. OffGrid selected?", isOffGrid);
        loadSection.classList.toggle("d-none", !isOffGrid);
    }
}

function handleProvinceNoticeSetup() {
    const provinceInput = document.getElementById('province');
    const provinceNotice = document.getElementById('provinceNotice'); // ✅ ใช้ span ที่มี id ชัดเจน

    const MEA_Provinces = ["กรุงเทพมหานคร", "นนทบุรี", "สมุทรปราการ"];

    provinceInput.addEventListener('input', function () {
        const selectedProvince = provinceInput.value.trim();
        if (MEA_Provinces.includes(selectedProvince)) {
            provinceNotice.textContent = "อยู่ในพื้นที่ดูแลของ MEA (กฟน.)";
            provinceNotice.style.color = "orange";
        } else if (selectedProvince !== "") {
            provinceNotice.textContent = "อยู่ในพื้นที่ดูแลของ PEA (กฟภ.)";
            provinceNotice.style.color = "purple";
        } else {
            provinceNotice.textContent = "";
        }
    });
}


function handleResetButtonSetup() {
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetForm);
        console.log("✅ Reset button listener added.");
    } else {
        console.warn("⚠️ Reset button not found.");
    }
}


// ฟังก์ชันโหลดตัวเลือกแบตเตอรี่
async function loadBatteryOptions() {
    try {
        const response = await fetch('/get_battery_list');
        if (!response.ok) {
            throw new Error(`Failed to fetch battery list: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === "success") {
            const batterySystemDiv = document.getElementById('batterySystem');
            batterySystemDiv.innerHTML = '<label>เลือกระบบแบตเตอรี่:</label>'; // ล้างตัวเลือกเก่า

            data.data.forEach(battery => {
                const batteryId = `battery${battery.Voltage}`;
                const input = document.createElement('input');
                input.type = 'radio';
                input.id = batteryId;
                input.name = 'batterySystem';
                input.value = battery.Voltage;

                const label = document.createElement('label');
                label.htmlFor = batteryId;
                label.textContent = `${battery.Voltage}V (${battery.Brand} - ${battery.Capacity}Ah, ${battery.Price} THB)`;

                batterySystemDiv.appendChild(input);
                batterySystemDiv.appendChild(label);
            });
        } else {
            console.error('Error loading battery options:', data.message);
        }
    } catch (error) {
        console.error('Error loading battery options:', error);
    }
}

// ฟังก์ชันคำนวณขนาดแบตเตอรี่
function calculateBatteryCapacity(totalEnergy, selectedBatteryVoltage) {
    if (!totalEnergy || !selectedBatteryVoltage) return 0;

    // คำนวณ Ah: (พลังงานรวมต่อวัน / 0.8) / แรงดันแบตเตอรี่ที่เลือก
    const batteryCapacity = (totalEnergy / 0.8) / selectedBatteryVoltage;
    return batteryCapacity.toFixed(2); // คืนค่า 2 ตำแหน่งทศนิยม
}

async function fetchBatteryList(backupDays) {
    try {
        const totalEnergy = parseFloat(document.getElementById("totalEnergyDisplay").innerText.split(": ")[1]) || 0;
        const response = await fetch(`/get_battery_list?backup_days=${backupDays}&total_energy=${totalEnergy}`);
        const data = await response.json();

        if (data.status === "success") {
            console.log("🔋 รายการแบตเตอรี่:", data.data);

            const batteryTable = document.getElementById("batteryDetails");
            batteryTable.innerHTML = `
                <h3>ข้อมูลแบตเตอรี่ที่ต้องใช้</h3>
                <table>
                    <tr>
                        <th>เลือก</th>
                        <th>Brand</th>
                        <th>Voltage (V)</th>
                        <th>Capacity (Ah)</th>
                        <th>Price (THB)</th>
                        <th>จำนวนที่ต้องใช้</th>
                        <th>ราคารวม (THB)</th>
                    </tr>
                    ${data.data.map(battery => `
                        <tr>
                            <td><input type="radio" name="selectedBattery" value="${battery["Brand"]}"></td>
                            <td>${battery["Brand"]}</td>
                            <td>${battery["Voltage (V)"]}</td>
                            <td>${battery["Capacity (Ah)"]}</td>
                            <td>${battery["Price (THB)"].toLocaleString()}</td>
                            <td>${battery["Required Batteries"]}</td>
                            <td>${battery["Total Price (THB)"].toLocaleString()}</td>
                        </tr>
                    `).join("")}
                </table>
            `;
            batteryTable.style.display = "block";
        } else {
            console.error("❌ เกิดข้อผิดพลาด:", data.message);
        }
    } catch (error) {
        console.error("❌ ไม่สามารถโหลดข้อมูลแบตเตอรี่:", error);
    }
}

// เรียกใช้ฟังก์ชันเมื่อเลือกจำนวนวันที่สำรองแบต
document.querySelectorAll("input[name='backupdays']").forEach(radio => {
    radio.addEventListener("change", function () {
        document.getElementById("batteryDetails").classList.add("d-none"); // ✅ ซ่อนตารางแบตเตอรี่
        document.getElementById("panelSystem").classList.add("d-none"); // ✅ ซ่อนตารางแผงโซลาร์เซลล์
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const priceSummary = document.getElementById('priceSummary');

    // ✅ ซ่อน "ประมาณราคา =" ตอนโหลดหน้า
    if (priceSummary) {
        priceSummary.style.display = "none"; 
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const offGridRadio = document.getElementById("offGrid");
    const onGridRadio = document.getElementById("onGrid");
    const loadSection = document.getElementById("loadSection");

    // ฟังก์ชันเปลี่ยนการแสดงผลโหลด
    function toggleLoadSection() {
        const isOffGrid = offGridRadio.checked;
        console.log("🧪 toggleLoadSection() called. OffGrid selected?", isOffGrid);
        if (isOffGrid) {
            loadSection.classList.remove("d-none");
        } else {
            loadSection.classList.add("d-none");
        }
    }

    // เรียกครั้งแรกตอนโหลด
    toggleLoadSection();

    // ตั้ง listener เวลาผู้ใช้เลือก radio ใหม่
    offGridRadio.addEventListener("change", toggleLoadSection);
    onGridRadio.addEventListener("change", toggleLoadSection);
});


async function drawRectangle() {
    console.log("กำลังแสดงผลข้อมูล...");

    const selectedSystemType = document.querySelector('input[name="systemType"]:checked');
    const selectedBattery = document.querySelector('input[name="batterySystem"]:checked');
    const selectedBackupDays = parseInt(document.querySelector('input[name="backupdays"]:checked')?.value || "1");

    const batteryContainer = document.getElementById('batteryDetails');
    const panelContainer = document.getElementById('panelSystem');
    const priceSummary = document.getElementById('priceSummary');
    const solarInstallationDisplay = document.getElementById('solarInstallationDisplay');
    const chargerContainer = document.getElementById("solarChargerContainer");

    // ซ่อนผลลัพธ์ก่อนเริ่ม
    batteryContainer.classList.add('d-none');
    panelContainer.classList.add('d-none');
    chargerContainer.classList.add('d-none');
    batteryContainer.innerHTML = '';
    panelContainer.innerHTML = '';
    chargerContainer.innerHTML = '';
    priceSummary.textContent = "ประมาณราคา = ";
    solarInstallationDisplay.textContent = "";
    priceSummary.style.display = "block";

    if (!selectedSystemType || selectedSystemType.id !== 'offGrid') {
        alert("กรุณาเลือกประเภทระบบ Off-Grid ก่อน");
        return;
    }

    if (!selectedBattery) {
        alert('กรุณาเลือกระบบแบตเตอรี่');
        return;
    }

    const voltage = parseFloat(selectedBattery.value);
    const totalEnergyPerDay = parseFloat(calculateTotalEnergyPerDay());

    if (isNaN(totalEnergyPerDay) || totalEnergyPerDay <= 0) {
        alert("กรุณาใส่ข้อมูลอุปกรณ์เพื่อคำนวณพลังงานรวม");
        return;
    }

    const totalEnergyForBattery = totalEnergyPerDay * selectedBackupDays;
    const requiredBatteryCapacityWh = (totalEnergyForBattery / 0.8).toFixed(2);
    const sunHoursInput = document.getElementById("sunHoursInput");
    const sunHours = parseFloat(sunHoursInput?.value) || 4;  // fallback เป็น 4 ถ้าไม่ได้ใส่
    
    console.log("🌞 ชั่วโมงแดดเฉลี่ยที่ใช้ในการคำนวณ =", sunHours);
    
    const requiredSolarPowerW = (totalEnergyPerDay / 0.8 / sunHours).toFixed(2);
    

    solarInstallationDisplay.innerHTML = `<strong>⚡ กำลังติดตั้งแผงโซลาร์เซลล์ที่ต้องใช้: ${requiredSolarPowerW} W</strong>`;
    priceSummary.classList.add("d-none");

    let filteredData = [];

    try {
        const batteryResponse = await fetch(`/get_battery_list?backup_days=${selectedBackupDays}&total_energy=${totalEnergyForBattery}`);
        const batteryResult = await batteryResponse.json();

        if (batteryResult.status === 'success') {
            filteredData = batteryResult.data.filter(battery =>
                parseFloat(battery["Voltage (V)"]) === voltage);

            if (filteredData.length > 0) {
                let batteryTable = `
                    <h5 class="fw-bold text-success mb-3">🔋 เลือกแบตเตอรี่</h5>
                    <div class="table-responsive" style="overflow-x: auto;">
                        <table class="table table-bordered table-striped text-center align-middle" style="min-width: 1000px;">
                            <thead class="table-light">
                                <tr>
                                    <th>No</th>
                                    <th>เลือก</th>
                                    <th>Brand</th>
                                    <th>Voltage (V)</th>
                                    <th>Capacity (Ah)</th>
                                    <th>Price (THB)</th>
                                    <th>จำนวนที่ต้องใช้</th>
                                    <th>ราคารวม (THB)</th>
                                    <th>Charger</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                filteredData.forEach((battery, index) => {
                    const capacity = parseFloat(battery["Capacity (Ah)"]);
                    const price = parseFloat(battery["Price (THB)"]);
                    const quantityRequired = Math.ceil(requiredBatteryCapacityWh / (capacity * voltage));
                    const totalPrice = quantityRequired * price;
                    const charger = battery["Charger"] || "No";

                    batteryTable += `
                        <tr>
                            <td>${index + 1}</td>
                            <td><input type="radio" name="batterySelect" value="${index}" data-total-price="${totalPrice}" class="battery-radio"></td>
                            <td>${battery["Brand"] || "ไม่ระบุ"}</td>
                            <td>${battery["Voltage (V)"]}</td>
                            <td>${capacity.toLocaleString()}</td>
                            <td>${price.toLocaleString()}</td>
                            <td>${quantityRequired}</td>
                            <td>${totalPrice.toLocaleString()}</td>
                            <td>${charger}</td>
                        </tr>
                    `;
                });

                batteryTable += `
                            </tbody>
                        </table>
                    </div>
                `;
                batteryContainer.innerHTML = batteryTable;
                batteryContainer.classList.remove('d-none');
            } else {
                batteryContainer.innerHTML = `<div class="alert alert-warning">ไม่มีข้อมูลแบตเตอรี่สำหรับแรงดัน ${voltage}V</div>`;
                batteryContainer.classList.remove('d-none');
            }
        } else {
            batteryContainer.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${batteryResult.message}</div>`;
            batteryContainer.classList.remove('d-none');
        }

        // โหลดแผง
        const requiredSolarPowerKWp = await loadSolarPanelOptions(panelContainer, totalEnergyPerDay);
        await loadInverterOffGridOptions(
            document.getElementById("inverterContainerOffGrid"),
            parseFloat(requiredSolarPowerW / 1000),
            voltage
        );

        // โหลด Solar Charger ถ้ามี
        await handleChargerDisplay(filteredData, voltage);

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        batteryContainer.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>`;
        batteryContainer.classList.remove('d-none');
    }
    console.log("🔍 ระบบที่เลือก:", selectedSystemType.id);
    console.log("🔋 แบตเตอรี่ที่เลือก:", selectedBattery.value);
    console.log("📅 จำนวนวันที่ต้องการสำรอง:", selectedBackupDays);
    console.log("⚙️ พลังงานรวมต่อวัน:", totalEnergyPerDay);
    console.log("⚙️ พลังงานที่ต้องใช้รวมทั้งหมด:", totalEnergyForBattery);
    console.log("🔧 ความจุแบตเตอรี่ที่ต้องการ (Wh):", requiredBatteryCapacityWh);
    console.log("☀️ กำลังแผงที่ต้องการ (W):", requiredSolarPowerW);

}


async function handleChargerDisplay(filteredData, voltage) {
    const selectedBatteryIndex = parseInt(document.querySelector('input[name="batterySelect"]:checked')?.value || "-1");
    const selectedBatteryData = filteredData[selectedBatteryIndex];
    const chargerContainer = document.getElementById("solarChargerContainer");

    chargerContainer.classList.add('d-none');
    chargerContainer.innerHTML = '';

    if (selectedBatteryData && selectedBatteryData["Charger"] === "Yes" && (voltage === 12 || voltage === 24)) {
        try {
            const chargerRes = await fetch('/get_solar_charger_list');
            const chargerData = await chargerRes.json();

            if (chargerData.status === 'success') {
                const chargerList = chargerData.data.filter(charger => parseInt(charger["Voltage"]) === voltage);
                if (chargerList.length > 0) {
                    let chargerTable = `
                        <h5 class="fw-bold text-success mt-4">🔌 เลือก Solar Charger</h5>
                        <div class="table-responsive">
                            <table class="table table-bordered text-center align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>No</th>
                                        <th>เลือก</th>
                                        <th>Brand</th>
                                        <th>Voltage</th>
                                        <th>Type</th>
                                        <th>Current (A)</th>
                                        <th>Price (THB)</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    chargerList.forEach((charger, index) => {
                        chargerTable += `
                            <tr>
                                <td>${index + 1}</td>
                                <td><input type="radio" name="chargerSelect" value="${index}" data-price="${charger["Price (THB)"]}"></td>
                                <td>${charger.Brand}</td>
                                <td>${charger.Voltage}</td>
                                <td>${charger.Type}</td>
                                <td>${charger["Current(A)"]}</td>
                                <td>${parseFloat(charger["Price (THB)"]).toLocaleString()}</td>
                            </tr>
                        `;
                    });

                    chargerTable += `
                                </tbody>
                            </table>
                        </div>
                    `;

                    chargerContainer.innerHTML = chargerTable;
                    chargerContainer.classList.remove('d-none');
                } else {
                    chargerContainer.innerHTML = '<div class="alert alert-warning">ไม่มี Solar Charger สำหรับแบตเตอรี่ขนาดนี้</div>';
                    chargerContainer.classList.remove('d-none');
                }
            } else {
                chargerContainer.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${chargerData.message}</div>`;
                chargerContainer.classList.remove('d-none');
            }
        } catch (error) {
            console.error("❌ Error loading solar charger:", error);
            chargerContainer.innerHTML = `<div class="alert alert-danger">ไม่สามารถโหลด Solar Charger ได้</div>`;
            chargerContainer.classList.remove('d-none');
        }
    }
}



function updateBatteryUsage() {
    const rows = document.querySelectorAll("#deviceTable tr");
    let totalEnergy = 0;

    rows.forEach((row, index) => {
        if (index === 0) return; // ข้ามหัวตาราง

        const powerInput = row.querySelector("input[name^='power']");
        const quantityInput = row.querySelector("input[name^='quantity']");
        const hoursInput = row.querySelector("input[name^='hours']");
        const wattInput = row.querySelector("input[name^='watt']");

        if (powerInput && quantityInput && hoursInput && wattInput) {
            let power = parseFloat(powerInput.value) || 0;
            let quantity = parseInt(quantityInput.value) || 0;
            let hours = parseFloat(hoursInput.value) || 0;

            // ✅ คำนวณพลังงานต่อวัน ไม่คูณ backupDays
            let dailyConsumption = power * quantity * hours;

            wattInput.value = dailyConsumption.toFixed(2); // ✅ แสดงค่า Wh/วัน สำหรับ 1 วัน
            totalEnergy += dailyConsumption;
        }
    });

    document.getElementById("totalEnergyDisplay").innerText = `พลังงานรวมทั้งหมดต่อวัน: ${totalEnergy.toFixed(2)} Wh`;
}

async function handleOffGridSelection(province, selectedBattery) {
    const batteryDetails = document.getElementById('batteryDetails');
    if (!selectedBattery) {
        alert('กรุณาเลือกระบบแบตเตอรี่');
        return;
    }

    document.getElementById('selectedProvince').textContent = `จังหวัด: ${province || '-'}`;
    document.getElementById('selectedSystemType').textContent = 'ประเภท: Off-Grid';
    batteryDetails.classList.remove('d-none');

    const voltage = selectedBattery.value; // แรงดันแบตเตอรี่
    await displayFilteredBatteryList(voltage); // แสดงตารางแบตเตอรี่
}

function handleOtherSystemSelection(province, selectedSystemType) {
    const batteryDetails = document.getElementById('batteryDetails');

    document.getElementById('selectedProvince').textContent = `จังหวัด: ${province || '-'}`;
    document.getElementById('selectedSystemType').textContent = `ประเภท: ${selectedSystemType ? selectedSystemType.labels[0].textContent : '-'}`;
    batteryDetails.classList.add('d-none');
    batteryDetails.innerHTML = ''; // ล้างเนื้อหาในตารางแบตเตอรี่
}

// ฟังก์ชันโหลดข้อมูลอุปกรณ์สำหรับแถวใหม่
function loadDevicesForRow(rowNumber) {
    fetch('/static/devices.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch devices: ${response.status}`);
            }
            return response.json();
        })
        .then(devices => {
            // ตรวจสอบ datalist
            let dataList = document.getElementById(`deviceList${rowNumber}`);
            if (!dataList) {
                dataList = document.createElement('datalist');
                dataList.id = `deviceList${rowNumber}`;
                document.body.appendChild(dataList); // เพิ่มเข้าไปหากยังไม่มี
            }

            // ล้างรายการเก่า
            dataList.innerHTML = "";

            // เพิ่ม option ใหม่
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.name;
                dataList.appendChild(option);
            });

            const deviceInput = document.querySelector(`input[name="device${rowNumber}"]`);
            if (deviceInput) {
                deviceInput.setAttribute("list", `deviceList${rowNumber}`);

                const newDeviceInput = deviceInput.cloneNode(true);
                deviceInput.parentNode.replaceChild(newDeviceInput, deviceInput);

                newDeviceInput.addEventListener('input', function () {
                    const selectedDevice = devices.find(device => device.name === newDeviceInput.value);
                    const powerInput = document.querySelector(`input[name="power${rowNumber}"]`);
                    if (powerInput && selectedDevice) {
                        powerInput.value = selectedDevice.power;
                    }
                });
            }
        })
        .catch(error => console.error('Error loading devices:', error));
}

function handleSystemTypeChange() {
    const selectedSystemType = document.querySelector('input[name="systemType"]:checked');
    const batterySystemDiv = document.getElementById('batterySystem');
    const batteryDetails = document.getElementById('batteryDetails');
    const priceSummary = document.getElementById('priceSummary');
    const backupDaysDiv = document.getElementById('backupdays');
    const loadSection = document.getElementById('loadSection');
    const onGridInputSection = document.getElementById('onGridInputSection');
    const solarChargerContainer = document.getElementById('solarChargerContainer');

    const containersToClear = ["batteryDetails", "panelSystem", "inverterContainer", "inverterContainerOffGrid"];
    containersToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            el.classList.add("d-none");
        }
    });

    const summary = document.getElementById("priceSummary");
    const solarText = document.getElementById("solarInstallationDisplay");
    if (summary) {
        summary.textContent = "ประมาณราคา = ";
        summary.classList.add("d-none");
    }
    if (solarText) {
        solarText.textContent = "";
    }

    if (selectedSystemType && selectedSystemType.id === 'offGrid') {
        batterySystemDiv.classList.remove('d-none');
        backupDaysDiv.classList.remove('d-none');
        loadSection.classList.remove('d-none');
        onGridInputSection.classList.add('d-none');
    } else if (selectedSystemType && selectedSystemType.id === 'onGrid') {
        batterySystemDiv.classList.add('d-none');
        backupDaysDiv.classList.add('d-none');
        batteryDetails.classList.add('d-none');
        batteryDetails.innerHTML = '';
        loadSection.classList.add('d-none');
        onGridInputSection.classList.remove('d-none');
    }
    if (solarChargerContainer) {
        solarChargerContainer.classList.add("d-none");
        solarChargerContainer.innerHTML = "";
    }
}

function handleCalculate() {
    const selectedSystemType = document.querySelector('input[name="systemType"]:checked');
    console.log("📌 systemType ที่เลือกตอนกดคำนวณ:", selectedSystemType?.id);

    const loadSection = document.getElementById("loadSection");
    console.log("📌 สถานะ loadSection ก่อนคำนวณ:", loadSection?.classList.toString());

    if (!selectedSystemType) {
        alert("กรุณาเลือกประเภทระบบก่อน");
        return;
    }

    if (selectedSystemType.id === 'offGrid') {
        console.log("📦 Off-Grid mode selected");
        drawRectangle();
    } else if (selectedSystemType.id === 'onGrid') {
        console.log("🌐 On-Grid mode selected");
        handleOnGridCalculation();
    }

    console.log("📌 สถานะ loadSection หลังคำนวณ:", loadSection?.classList.toString());
}


async function handleOnGridCalculation() {
    const reductionInput = document.getElementById('desiredReduction');
    const province = document.getElementById('province').value.trim();
    const outputDiv = document.getElementById('onGridResult');
    const panelContainer = document.getElementById('panelSystem');
    const priceSummary = document.getElementById('priceSummary');
    const loadSection = document.getElementById("loadSection");
    if (loadSection) loadSection.classList.add("d-none");

    if (!reductionInput || !outputDiv || !province) return;

    const desiredReduction = parseFloat(reductionInput.value);
    const sunHours = parseFloat(document.getElementById("sunHoursInput")?.value) || 4;
    
    const dailyReduction = desiredReduction / 30;
    const requiredKw = (dailyReduction / sunHours).toFixed(2);
    

    outputDiv.textContent = `ขนาดระบบที่ต้องใช้: ${requiredKw} kWp`;

    const estimatedDailyEnergy = requiredKw * 1000;
    panelContainer.innerHTML = '';
    priceSummary.textContent = "ประมาณราคา = ";

    const inverterContainer = document.getElementById("inverterContainer");
    inverterContainer.innerHTML = '';

    const requiredSolarPowerKWp = await loadSolarPanelOptions(panelContainer, estimatedDailyEnergy, true);
    if (requiredSolarPowerKWp) {
        await loadInverterOnGridOptions(inverterContainer, parseFloat(requiredSolarPowerKWp));
    }

    calculateTotalPrice();
}

function initializeDeviceTable() {
    const rows = document.querySelectorAll('#deviceTable tr');
    rowCounter = rows.length - 1;

    for (let i = 1; i <= rowCounter; i++) {
        loadDevicesForRow(i);
        addCalculationListener(i);
    }
}

function addDeviceRow() {
    rowCounter++;
    const table = document.getElementById('deviceTable');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCounter}</td>
        <td>
        <div class="d-flex align-items-center gap-2">
            <input list="deviceList${rowCounter}" name="device${rowCounter}" placeholder="ชื่ออุปกรณ์" class="form-control form-control-sm">
            <datalist id="deviceList${rowCounter}"></datalist>
            <button type="button" class="reset-button" onclick="resetRow(this)">
            <i class="bi bi-arrow-repeat fs-5 text-secondary"></i>
            </button>
        </div>
        </td>
        <td><input type="text" name="power${rowCounter}" placeholder="W" class="form-control form-control-sm text-center"></td>
        <td><input type="text" name="quantity${rowCounter}" placeholder="จำนวน" class="form-control form-control-sm text-center"></td>
        <td><input type="text" name="hours${rowCounter}" placeholder="ชม./วัน" class="form-control form-control-sm text-center"></td>
        <td><input type="text" name="watt${rowCounter}" placeholder="Wh/วัน" class="form-control form-control-sm text-center" readonly></td>
        <td>
            <button type="button" class="delete-button" onclick="deleteRow(this)">
            <i class="bi bi-trash3 fs-5 text-danger"></i>
            </button>
        </td>
    `;


    table.querySelector('tbody').appendChild(row);

    loadDevicesForRow(rowCounter);
    addCalculationListener(rowCounter);
}


function resetRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.querySelector('input[name^="device"]').value = '';
        row.querySelector('input[name^="power"]').value = '';
        row.querySelector('input[name^="quantity"]').value = '';
        row.querySelector('input[name^="hours"]').value = '';
        row.querySelector('input[name^="watt"]').value = '';

        const rowNumber = row.querySelector('input[name^="device"]').getAttribute('name').match(/\d+$/)[0];

        loadDevicesForRow(rowNumber);
        addCalculationListener(rowNumber);
    }
}

function deleteRow(button) {
    const row = button.closest('tr'); // ค้นหาแถวที่ปุ่มอยู่
    row.remove(); // ลบแถวออกจาก DOM

    const rows = document.querySelectorAll('#deviceTable tr'); // ดึงแถวที่เหลือทั้งหมด
    rowCounter = rows.length - 1; // ปรับจำนวนแถวที่เหลือ

    rows.forEach((row, index) => {
        if (index > 0) { // ข้ามหัวตาราง
            const rowNumber = index;

            // อัปเดตลำดับในคอลัมน์แรก
            row.querySelector('td:first-child').textContent = rowNumber;

            // อัปเดตชื่อและ ID ของ input/datalist ในแถว
            row.querySelectorAll('input').forEach(input => {
                const originalName = input.getAttribute('name');
                if (originalName) {
                    const newName = originalName.replace(/\d+$/, rowNumber);
                    input.setAttribute('name', newName);
                }
            });

            const datalist = row.querySelector('datalist');
            if (datalist) {
                datalist.setAttribute('id', `deviceList${rowNumber}`);
            }
            loadDevicesForRow(rowNumber);
            addCalculationListener(rowNumber);
        }
    });
}

function addCalculationListener(rowNumber) {
    const quantityInput = document.querySelector(`input[name="quantity${rowNumber}"]`);
    const hoursInput = document.querySelector(`input[name="hours${rowNumber}"]`);

    quantityInput.addEventListener('input', function () {
        calculateWattPerDay(rowNumber);
    });

    hoursInput.addEventListener('input', function () {
        calculateWattPerDay(rowNumber);
    });
}

function calculateWattPerDay(rowNumber) {
    const power = parseFloat(document.querySelector(`input[name="power${rowNumber}"]`).value) || 0;
    const quantity = parseFloat(document.querySelector(`input[name="quantity${rowNumber}"]`).value) || 0;
    const hours = parseFloat(document.querySelector(`input[name="hours${rowNumber}"]`).value) || 0;

    const wattPerDay = power * quantity * hours;
    document.querySelector(`input[name="watt${rowNumber}"]`).value = wattPerDay.toFixed(2); // แสดงผลด้วยทศนิยม 2 ตำแหน่ง

    updateTotalEnergyDisplay();
}

function calculateTotalEnergyPerDay() {
    let totalEnergy = 0;

    for (let i = 1; i <= rowCounter; i++) {
        const wattInput = document.querySelector(`input[name="watt${i}"]`);
        if (wattInput) {
            totalEnergy += parseFloat(wattInput.value) || 0;
        }
    }

    return totalEnergy.toFixed(2);
}

function updateTotalEnergyDisplay() {
    const rows = document.querySelectorAll('#deviceTable tr');
    let totalEnergy = 0;

    rows.forEach((row, index) => {
        if (index > 0) {
            const wattInput = row.querySelector(`input[name^="watt"]`);
            if (wattInput) {
                totalEnergy += parseFloat(wattInput.value) || 0;
            }
        }
    });

    const totalEnergyDisplay = document.getElementById('totalEnergyDisplay');
    totalEnergyDisplay.textContent = `พลังงานรวมทั้งหมดต่อวัน: ${totalEnergy.toFixed(2)} Wh`;
}

document.querySelectorAll('input[name="systemType"]').forEach(radio => {
    radio.addEventListener('change', handleSystemTypeChange);
});

document.querySelectorAll('input[name="phaseType"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const systemType = document.querySelector('input[name="systemType"]:checked')?.id;
        if (systemType === "offGrid") {
            drawRectangle(); // โหลดใหม่แบบ Off-Grid
        } else if (systemType === "onGrid") {
            handleCalculate(); // โหลดใหม่แบบ On-Grid
        }
    });
});


function handleBatterySelection() {
    const selectedBattery = document.querySelector('input[name="batterySystem"]:checked');
    const batteryContainer = document.getElementById('batteryDetails');
    if (!selectedBattery) {
        batteryContainer.classList.add('d-none');
        batteryContainer.innerHTML = '';
    }
}

function resetForm() {
    console.log("Reset form triggered");
    const confirmReset = confirm("คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?");
    if (!confirmReset) {
        console.log("Reset cancelled by user");
        return;
    }

    const form = document.getElementById('rectangleForm');
    if (form) {
        form.reset();
        console.log("Form reset.");
    } else {
        console.error("Form not found.");
    }

    const batterySystemDiv = document.getElementById('batterySystem');
    const batteryDetails = document.getElementById('batteryDetails');
    const panelSystemDiv = document.getElementById('panelSystem');
    const priceSummary = document.getElementById('priceSummary');
    const totalEnergyDisplay = document.getElementById('totalEnergyDisplay');
    const solarInstallationDisplay = document.getElementById('solarInstallationDisplay');
    const chargerContainer = document.getElementById('solarChargerContainer');

    if (batterySystemDiv) batterySystemDiv.classList.add('d-none');
    if (batteryDetails) {
        batteryDetails.classList.add('d-none');
        batteryDetails.innerHTML = '';
    }
    if (panelSystemDiv) {
        panelSystemDiv.classList.add('d-none');
        panelSystemDiv.innerHTML = '';
    }
    if (priceSummary) {
        priceSummary.textContent = "ประมาณราคา = ";
        priceSummary.classList.add("d-none");
    }
    
    if (totalEnergyDisplay) totalEnergyDisplay.textContent = "พลังงานรวมทั้งหมดต่อวัน: 0.00 Wh";
    if (solarInstallationDisplay) 
        solarInstallationDisplay.textContent = "";

    if (chargerContainer) {
        chargerContainer.classList.add('d-none');
        chargerContainer.innerHTML = '';
    }
    const inverterContainers = ["inverterContainer", "inverterContainerOffGrid"];
    inverterContainers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            el.classList.add("d-none");
        }
    });

    const deviceTable = document.getElementById('deviceTable');
    if (deviceTable) {
        const rows = deviceTable.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index > 0) row.remove();
        });

        const initialRow = `
            <tr>
                <td>1</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <input list="deviceList1" name="device1" placeholder="ชื่ออุปกรณ์" class="form-control form-control-sm">
                        <datalist id="deviceList1"></datalist>
                        <button type="button" class="reset-button" onclick="resetRow(this)">
                        <i class="bi bi-arrow-repeat fs-5 text-secondary"></i>
                        </button>
                    </div>
                </td>

                    <td><input type="text" name="power1" placeholder="W" class="form-control form-control-sm text-center"></td>
                    <td><input type="text" name="quantity1" placeholder="จำนวน" class="form-control form-control-sm text-center"></td>
                    <td><input type="text" name="hours1" placeholder="ชม./วัน" class="form-control form-control-sm text-center"></td>
                    <td><input type="text" name="watt1" placeholder="Wh/วัน" class="form-control form-control-sm text-center" readonly></td>

                <td>
                    <button type="button" class="delete-button" onclick="deleteRow(this)">
                        <i class="bi bi-trash3 fs-5 text-danger"></i>
                    </button>

                </td>
            </tr>
        `;
        deviceTable.insertAdjacentHTML('beforeend', initialRow);
        console.log("Device table reset.");
    } else {
        console.error("Device table not found.");
    }

    console.log("Form reset complete.");
}

const panelSystemDiv = document.getElementById('panelSystem');
panelSystemDiv.innerHTML = '<label>เลือกระบบแผงโซลาร์เซลล์:</label>';

async function fetchAndSanitizeJSON(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const sanitizedText = text.replace(/NaN/g, "null");
        const data = JSON.parse(sanitizedText);
        return data;
    } catch (error) {
        console.error("Error fetching or sanitizing JSON:", error);
        return null;
    }
}

async function getPvoutForProvince(province) {
    try {
        const response = await fetch('/static/provinces_pvout.json');
        const data = await response.json();
        return data[province]?.pvout || 120;
    } catch (error) {
        console.error("ไม่สามารถโหลด pvout ได้:", error);
        return 120;
    }
}

function showLoadSection() {
    const section = document.getElementById('loadSection');
    if (section) {
      section.classList.remove('d-none');
    }
  }

async function loadInverterOffGridOptions(container, requiredKw = 0, batteryVoltage = null) {
    const selectedPhase = document.querySelector('input[name="phaseType"]:checked')?.value || "1";
    console.log("📡 เฟสที่เลือก:", selectedPhase);
    console.log("📦 container id:", container?.id);
    console.log("⚙️ เรียกฟังก์ชัน loadInverterOffGridOptions ด้วย:", {
        requiredKw,
        batteryVoltage
    });

    try {
        const response = await fetch('/get_inverter_offgrid');
        const result = await response.json();

        if (result.status === "success") {
            let inverters = result.data;
            console.log("📥 ได้ข้อมูล inverter ทั้งหมด:", inverters.length);

            inverters = inverters.filter(inv => {
                const rated = parseFloat(inv["Rated Power(kW)"]);
                return !isNaN(rated) && rated >= requiredKw;
            });
            console.log("🔍 หลังกรองกำลังไฟ >= requiredKw:", inverters.length);

            inverters = inverters.filter(inv => {
                const invPhase = inv.Phase?.toString().trim();
                return invPhase === selectedPhase;
            });
            console.log(`🎛️ หลังกรองด้วยเฟส ${selectedPhase}: เหลือ`, inverters.length, "ตัว");

            if (batteryVoltage !== null) {
                inverters = inverters.filter(inv => {
                    const rawVoltages = inv["Voltage_battery"];
                    let supportedVoltages = [];

                    if (Array.isArray(rawVoltages)) {
                        supportedVoltages = rawVoltages.map(v => parseInt(v)).filter(v => !isNaN(v));
                    } else if (typeof rawVoltages === "string") {
                        supportedVoltages = rawVoltages.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    } else if (typeof rawVoltages === "number") {
                        supportedVoltages = [parseInt(rawVoltages)];
                    }

                    return supportedVoltages.includes(parseInt(batteryVoltage));
                });
                console.log("🔋 หลังกรองด้วยแบตเตอรี่แรงดัน", batteryVoltage, "V: เหลือ", inverters.length, "ตัว");
            }

            if (inverters.length === 0) {
                console.warn("⚠️ ไม่พบ Inverter ที่ตรงเงื่อนไขทั้งหมด");
                container.innerHTML = '<p class="text-danger">⚠️ ไม่มี Inverter Off-Grid ที่ตรงกับเงื่อนไขที่เลือก</p>';
                return;
            }

            let tableHTML = `
                <h5 class="fw-bold text-success mb-3">🔌 เลือก Inverter สำหรับระบบ Off-Grid</h5>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-bordered text-center align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>No</th>
                            <th>เลือก</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Rated Power (kW)</th>
                            <th>Phase</th>
                            <th>Voltage</th>
                            <th>Eff. %</th>
                            <th>แบตเตอรี่ที่รองรับ</th>
                            <th>ราคา (THB)</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>`;

            inverters.forEach((inv, index) => {
                tableHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><input type="radio" name="inverterSelect" value="${index}" data-price="${inv["Price(Baht)"]}"></td>
                        <td>${inv.Brand}</td>
                        <td>${inv.Model}</td>
                        <td>${inv["Rated Power(kW)"]}</td>
                        <td>${inv.Phase || '-'}</td>
                        <td>${inv.Voltage || '-'}</td>
                        <td>${inv["Eff. %"] || '-'}</td>
                        <td>${inv["Voltage_battery"] || '-'}</td>
                        <td>${parseFloat(inv["Price(Baht)"]).toLocaleString()}</td>
                        <td><a href="${inv["Link URL"]}" target="_blank">ดูข้อมูล</a></td>
                    </tr>`;
            });

            tableHTML += `</tbody></table></div>`;
            container.innerHTML = tableHTML;
            container.classList.remove("d-none");

        } else {
            console.error("❌ API ตอบกลับ error:", result.message);
            container.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาด: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการโหลด Inverter Off-Grid:", error);
        container.innerHTML = "<p class='text-danger'>เกิดข้อผิดพลาดในการโหลด Inverter Off-Grid</p>";
    }

    console.log("✅ เสร็จสิ้น loadInverterOffGridOptions()");
}


async function loadInverterOnGridOptions(container, requiredKw = 0) {
    const selectedPhase = document.querySelector('input[name="phaseType"]:checked')?.value || "1";
    console.log("📡 เฟสที่เลือก:", selectedPhase);

    try {
        const response = await fetch('/get_inverter_ongrid');
        const result = await response.json();

        if (result.status === "success") {
            let inverters = result.data;
            console.log("🎯 ได้ inverter ทั้งหมด:", inverters.length);

            const filteredInverters = inverters.filter(inv => {
                const rated = parseFloat(inv["Rated Power(kW)"]);
                const phase = inv.Phase?.toString().trim();
                return !isNaN(rated) && rated > requiredKw && phase === selectedPhase;
            });

            console.log(`✅ หลังกรองด้วยเฟส ${selectedPhase} และกำลังไฟ > ${requiredKw}:`, filteredInverters.length, "ตัว");

            if (filteredInverters.length === 0) {
                container.innerHTML = '<p class="text-danger">⚠️ ไม่มี Inverter ที่ตรงกับขนาดระบบและระบบเฟสที่เลือก</p>';
                return;
            }

            let tableHTML = `
            <h5 class="fw-bold text-success mb-3">⚡ เลือก Inverter สำหรับระบบ On-Grid</h5>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto; overflow-x: auto;">
            <table class="table table-bordered text-center align-middle" style="min-width: 1100px;">
                <thead class="table-light">
                    <tr>
                        <th>No</th>
                        <th>เลือก</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Rated Power (kW)</th>
                        <th>Phase</th>
                        <th>Efficiency (%)</th>
                        <th>Price (THB)</th>
                        <th>Link</th>
                    </tr>
                </thead>
                <tbody>`;
        
            filteredInverters.forEach((inv, index) => {
                tableHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><input type="radio" name="inverterSelect" value="${index}" data-price="${inv['Price(Baht)']}"></td>
                        <td>${inv.Brand}</td>
                        <td>${inv.Model}</td>
                        <td>${inv["Rated Power(kW)"]}</td>
                        <td>${inv.Phase}</td>
                        <td>${inv["Eff. %"] || '-'}</td>
                        <td>${parseFloat(inv["Price(Baht)"]).toLocaleString()}</td>
                        <td><a href="${inv["Link URL"]}" target="_blank">ดูข้อมูล</a></td>
                    </tr>`;
            });

            tableHTML += `</tbody></table></div>`;
            container.innerHTML = tableHTML;
            container.classList.remove("d-none");

        } else {
            console.error("❌ API Error:", result.message);
            container.innerHTML = `<p>เกิดข้อผิดพลาด: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("❌ ไม่สามารถโหลดข้อมูล Inverter:", error);
        container.innerHTML = "<p>เกิดข้อผิดพลาดในการโหลด Inverter</p>";
    }
}

async function loadSolarPanelOptions(panelContainer, totalEnergy, isOnGrid = false) {
    try {
        const response = await fetch('/get_panel_list');
        if (!response.ok) {
            throw new Error(`Failed to fetch panel list: ${response.status}`);
        }

        const responseText = await response.text();
        const sanitizedText = responseText.replace(/\bNaN\b/g, 'null');
        const data = JSON.parse(sanitizedText);

        if (data.status === "success") {
            const requiredSolarPowerKWp = (totalEnergy / 1000).toFixed(2);  // ✅ ใช้ค่าที่คำนวณมาจากข้างนอกแล้ว

            console.log(`📐 ขนาดระบบที่แนะนำจาก panel: ${requiredSolarPowerKWp} kWp`);
            const requiredSolarPowerW = (requiredSolarPowerKWp * 1000).toFixed(2);

            let panelRows = "";
            let rowIndex = 1;

            data.data.forEach((panel, index) => {
                const watt = parseFloat(panel.Watt) || 0;
                const brand = panel.Brand || "ไม่ระบุ";
                const model = panel.Model || "-";
                const price = parseFloat(panel.Price) || 0;
                const width = panel.Width_m ? parseFloat(panel.Width_m).toFixed(3) : "ไม่ระบุ";
                const length = panel.Length_m ? parseFloat(panel.Length_m).toFixed(3) : "ไม่ระบุ";
                const link = panel["Link URL"]?.trim() || "";

                if (price === 0 || watt === 0) return;

                const panelQuantity = Math.ceil(requiredSolarPowerW / watt);
                const totalPrice = panelQuantity * price;

                panelRows += `
                    <tr>
                        <td>${rowIndex}</td>
                        <td><input type="radio" name="panelSelect" value="${index}" data-total-price="${totalPrice}" class="panel-radio"></td>
                        <td>${brand}</td>
                        <td>${model}</td>
                        <td>${watt}</td>
                        <td>${width}</td>
                        <td>${length}</td>
                        <td>${price.toLocaleString()}</td>
                        <td>${panelQuantity}</td>
                        <td>${totalPrice.toLocaleString()}</td>
                        <td>${link ? `<a href="${link}" target="_blank">ดูข้อมูล</a>` : "ไม่มีข้อมูล"}</td>
                    </tr>
                `;
                rowIndex++;
            });

            if (rowIndex === 1) {
                panelContainer.innerHTML = '<p class="text-danger">ไม่มีข้อมูลแผงโซลาร์ที่มีราคาขาย</p>';
            } else {
                panelContainer.innerHTML = `
                <h5 class="fw-bold text-success mb-3">☀️ เลือกแผงโซลาร์เซลล์</h5>
                <p class="mb-2">ขนาดระบบที่แนะนำ: <strong>${requiredSolarPowerKWp} kWp</strong></p>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto; overflow-x: auto;">
                    <table class="table table-bordered table-striped text-center align-middle" style="min-width: 1100px;">
                        <thead class="table-light">
                            <tr>
                                <th>No</th>
                                <th>เลือก</th>
                                <th>แบรนด์</th>
                                <th>Model</th>
                                <th>กำลังไฟฟ้า (W)</th>
                                <th>ความกว้าง (m)</th>
                                <th>ความยาว (m)</th>
                                <th>ราคา (THB)</th>
                                <th>จำนวนแผงที่ต้องใช้</th>
                                <th>ราคารวม (THB)</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${panelRows}
                        </tbody>
                    </table>
                </div>
            `;       
            }

            panelContainer.classList.remove('d-none');
            return requiredSolarPowerKWp;
        } else {
            panelContainer.innerHTML = '<p class="text-danger">ไม่สามารถโหลดข้อมูลแผงโซลาร์เซลล์ได้</p>';
            panelContainer.classList.remove('d-none');
            return null;
        }
    } catch (error) {
        console.error("❌ Error fetching panel list:", error);
        panelContainer.innerHTML = '<p class="text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูลแผงโซลาร์เซลล์</p>';
        panelContainer.classList.remove('d-none');
        return null;
    }
}

function calculateTotalPrice() {
    let totalBatteryPrice = 0;
    let totalPanelPrice = 0;
    let totalInverterPrice = 0;
    let totalChargerPrice = 0;

    const selectedBattery = document.querySelector('input[name="batterySelect"]:checked');
    if (selectedBattery) {
        totalBatteryPrice = parseFloat(selectedBattery.getAttribute("data-total-price")) || 0;
    }

    const selectedPanel = document.querySelector('input[name="panelSelect"]:checked');
    if (selectedPanel) {
        totalPanelPrice = parseFloat(selectedPanel.getAttribute("data-total-price")) || 0;
    }

    const selectedInverter = document.querySelector('input[name="inverterSelect"]:checked');
    if (selectedInverter) {
        totalInverterPrice = parseFloat(selectedInverter.getAttribute("data-price")) || 0;
    }

    const selectedCharger = document.querySelector('input[name="chargerSelect"]:checked');
    if (selectedCharger) {
        totalChargerPrice = parseFloat(selectedCharger.getAttribute("data-price")) || 0;
    }

    const totalPrice = totalBatteryPrice + totalPanelPrice + totalInverterPrice + totalChargerPrice;
    const systemType = document.querySelector('input[name="systemType"]:checked')?.id;
    const priceSummary = document.getElementById("priceSummary");

    priceSummary.classList.remove("d-none");
    priceSummary.style.display = "block";

    if (systemType === "offGrid") {
        let chargerLine = "";
        let hrLine = "";

        if (totalChargerPrice > 0) {
            chargerLine = `🔌 Solar Charger: ${totalChargerPrice.toLocaleString()} THB<br>`;
            hrLine = `<hr>`;
        }

        priceSummary.innerHTML = `
            <strong>ประมาณราคา:</strong><br>
            🔋 แบตเตอรี่: ${totalBatteryPrice.toLocaleString()} THB<br>
            ☀️ แผงโซลาร์เซลล์: ${totalPanelPrice.toLocaleString()} THB<br>
            ⚡ อินเวอร์เตอร์: ${totalInverterPrice.toLocaleString()} THB<br>
            ${chargerLine}
            ${hrLine}
            💰 <strong>รวมทั้งหมด:</strong> ${totalPrice.toLocaleString()} THB
        `;
    } else if (systemType === "onGrid") {
        const totalPriceOnGrid = totalPanelPrice + totalInverterPrice;
        priceSummary.innerHTML = `
            <strong>ประมาณราคา:</strong><br>
            ☀️ แผงโซลาร์เซลล์: ${totalPanelPrice.toLocaleString()} THB<br>
            ⚡ อินเวอร์เตอร์: ${totalInverterPrice.toLocaleString()} THB<br>
            <hr>
            💰 <strong>รวมทั้งหมด:</strong> ${totalPriceOnGrid.toLocaleString()} THB
        `;
    }
}

document.addEventListener("change", function (event) {
    if (event.target.name === "batterySelect" || event.target.name === "panelSelect") {
        calculateTotalPrice();
    }
});

document.addEventListener("change", function (event) {
    if (["batterySelect", "panelSelect", "inverterSelect"].includes(event.target.name)) {
        calculateTotalPrice();
    }
});

document.addEventListener("change", async function (event) {
    if (event.target.name === "batterySelect") {
        const voltage = parseFloat(document.querySelector('input[name="batterySystem"]:checked')?.value || "0");
        if (!isNaN(voltage) && (voltage === 12 || voltage === 24)) {
            const selectedBackupDays = parseInt(document.querySelector('input[name="backupdays"]:checked')?.value || "1");
            const totalEnergyPerDay = parseFloat(calculateTotalEnergyPerDay());
            const totalEnergyForBattery = totalEnergyPerDay * selectedBackupDays;

            const batteryResponse = await fetch(`/get_battery_list?backup_days=${selectedBackupDays}&total_energy=${totalEnergyForBattery}`);
            const batteryResult = await batteryResponse.json();

            if (batteryResult.status === 'success') {
                const filteredData = batteryResult.data.filter(battery =>
                    parseFloat(battery["Voltage (V)"]) === voltage);
                await handleChargerDisplay(filteredData, voltage);
            }
        }
    }
});