const fs = require('fs');

// Read auth.js
let authCode = fs.readFileSync('auth.js', 'utf8');

// Mock standard browser objects
global.window = {};
global.localStorage = {
    getItem: () => "uz-latn",
    setItem: () => {}
};
global.document = {
    head: {
        appendChild: () => {}
    },
    createElement: () => ({
        setAttribute: () => {},
        style: {}
    }),
    documentElement: {
        setAttribute: () => {},
        lang: "uz-Latn"
    },
    addEventListener: () => {}
};
global.Node = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
};

// Evaluate the transliteration and translation functions
try {
    eval(authCode);
} catch (e) {
    console.log("Error evaluating auth.js:", e.message);
}

// Test cases for translations
const testCases = [
    "Mahallam",
    "Vazifalar",
    "Yordam",
    "Chiqish",
    "3 qadam — muammo hal",
    "Yetkazib berish",
    "15 daqiqa oldin",
    "25,000 so'm",
    "1.2 km uzoqlikda",
    "Yunusobod",
    "Salom, Xurmo opa! 👋",
    "18 ta faol yordamchi yaqiningizda yordamga tayyor.",
    "Yunusobod tumani bo'yicha",
    "kranni tuzatish bo'yicha topshiriqni qabul qildi.",
    "\"Hovlini supirish\" vazifasini yakunladi."
];

console.log("=== TRANSLATION TEST ===");
["ru", "en"].forEach(lang => {
    console.log(`\n--- Target Language: ${lang.toUpperCase()} ---`);
    testCases.forEach(text => {
        const translated = translateText(text, lang);
        console.log(`Original:  "${text}"`);
        console.log(`Translated: "${translated}"`);
        console.log("---");
    });
});
