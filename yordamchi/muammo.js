
document.addEventListener("DOMContentLoaded", () => {
    const categoryCards = document.querySelectorAll(".category-card");
    const modTabs = document.querySelectorAll(".mod-tab");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const filePreviewContainer = document.getElementById("filePreviewContainer");
    const submitBtn = document.getElementById("submitComplaint");

    let selectedCategory = "firibgarlik"; // Standart tanlangan kategoriya

    // 1. TAB MENYULARNI ALMASHTIRISH
    modTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            modTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    // 2. SHIKOYAT TURINI TANLASH (CARD SELECTION)
    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            categoryCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            
            selectedCategory = card.getAttribute("data-category");
            console.log("Tanlangan muammo turi:", selectedCategory);
        });
    });

    // 3. FAILLARNI ZONAGA BOSIB YUKLASH (CLICK TO UPLOAD)
    dropzone.addEventListener("click", (e) => {
        // Agar preview ichidagi rasmlar bosilsa input ochilib ketmasligi uchun
        if (e.target === fileInput || e.target.classList.contains("preview-item")) return;
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        handleFiles(fileInput.files);
    });

    // 4. DRAG & DROP EFFEKTLARI
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = "#f7fafc";
        dropzone.style.borderColor = "#006653";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.backgroundColor = "#ffffff";
        dropzone.style.borderColor = "#48bb78";
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = "#ffffff";
        dropzone.style.borderColor = "#48bb78";
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Rasmlarni yuklaganda kichik vizual ko'rinish (preview) chiqarish funksiyasi
    function handleFiles(files) {
        filePreviewContainer.innerHTML = ""; // Avvalgilarini tozalash
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("preview-item");
                    filePreviewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 5. FORMALARI JO'NATISH SIMULYATSIYASI
    submitBtn.addEventListener("click", () => {
        const taskSelect = document.getElementById("taskSelect").value;
        
        alert(`Shikoyat muvaffaqiyatli qabul qilindi!\n\nMuammo turi: ${selectedCategory.toUpperCase()}\nVazifa ID: ${taskSelect}`);
    });
});
