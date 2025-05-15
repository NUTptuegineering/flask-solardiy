document.addEventListener('DOMContentLoaded', () => {
  const genOption = document.getElementById('genOption');
  const provinceSection = document.getElementById('provinceSection');
  const provinceSelect = document.getElementById('provinceSelect');
  const pshSection = document.getElementById('pshSection');
  const pshInput = document.getElementById('pshInput');  // <select> แล้วตอนนี้
  const genInput = document.getElementById('genInput');
  const form = document.querySelector('form');

  let provinceGenMap = {};

  // โหลด province_gen.json
  fetch('/static/provinces_pvout.json')
    .then(response => response.json())
    .then(data => {
      provinceGenMap = data;

      // เติม dropdown จังหวัด
      for (const province in data) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
      }
    });

  // toggle การแสดงผลตาม genOption
  genOption.addEventListener('change', () => {
    const selected = genOption.value;
    if (selected === 'province') {
      provinceSection.style.display = 'block';
      pshSection.style.display = 'none';
      genInput.value = provinceGenMap[provinceSelect.value]?.pvout || 1400;
    } else if (selected === 'psh') {
      provinceSection.style.display = 'none';
      pshSection.style.display = 'block';
      const psh = parseInt(pshInput.value);
      genInput.value = isNaN(psh) ? 1400 : (psh * 365).toFixed(2);
    } else {
      provinceSection.style.display = 'none';
      pshSection.style.display = 'none';
      genInput.value = 1400;
    }
  });

  // อัปเดตค่า gen เมื่อเลือกจังหวัด
  provinceSelect.addEventListener('change', () => {
    const selected = provinceSelect.value;
    if (provinceGenMap[selected]) {
      genInput.value = provinceGenMap[selected].pvout;
    } else {
      genInput.value = 1400;
    }
  });

  // อัปเดตค่า gen เมื่อเลือก PSH จาก dropdown
  pshInput.addEventListener('change', () => {
    const psh = parseInt(pshInput.value);
    if (!isNaN(psh)) {
      genInput.value = (psh * 365).toFixed(2);
    }
  });

  // ⏱️ ก่อน submit: คำนวณและแสดงสูตรใน console
  form.addEventListener('submit', () => {
    let gen = 1400;

    if (genOption.value === 'province') {
      const selected = provinceSelect.value;
      gen = provinceGenMap[selected]?.pvout || 1400;

      console.log("📍 เลือกจากจังหวัด:", selected);
      console.log("🔁 ใช้ค่า PVOUT จากจังหวัด: " + gen + " kWh/kWp/ปี");
    }

    else if (genOption.value === 'psh') {
      const psh = parseInt(pshInput.value) || 0;
      gen = psh * 365;

      console.log("📍 ผู้ใช้เลือก PSH:", psh + " ชั่วโมง/วัน");
      console.log("🔁 แปลงเป็น PVOUT โดยใช้สูตร:");
      console.log("    PVOUT = PSH × 365");
      console.log("    = " + psh + " × 365 = " + gen.toFixed(2) + " kWh/kWp/ปี");
    }

    else {
      console.log("📍 ใช้ค่ามาตรฐานประเทศไทย: 1400 kWh/kWp/ปี");
    }

    genInput.value = gen.toFixed(2);
  });

  // 👉 ตั้งค่าค่าเริ่มต้นเป็น PSH พร้อม default เป็น 4 ชั่วโมง
  genOption.value = 'psh';
  pshInput.value = '4';
  genOption.dispatchEvent(new Event('change'));
});
