// หน้าหลักเลือกโปรแกรม
window.addEventListener("DOMContentLoaded", () => {
    const heading2 = document.getElementById("heading2");
    const buttonGroup = document.getElementById("buttonGroup");
  
    // step 1: แสดง heading2 หลัง 500ms
    setTimeout(() => {
      heading2.classList.add("show");
    }, 300);
  
    // step 2: แสดงปุ่มทั้งหมดหลังจากนั้นอีก 500ms
    setTimeout(() => {
      buttonGroup.classList.add("show");
    }, 750);
  });
  
  