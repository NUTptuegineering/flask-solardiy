window.addEventListener("DOMContentLoaded", () => {
    const heading2 = document.getElementById("heading2");
    const buttonGroup = document.getElementById("buttonGroup");
  
    setTimeout(() => {
      heading2.classList.add("show");
    }, 300);

    setTimeout(() => {
      buttonGroup.classList.add("show");
    }, 750);
  });
  
  