/**
 * ============================================================
 * Theme Toggle
 * Estatus Outbound V2
 *
 * Tema oscuro por defecto (segun lo definido en el proyecto).
 * Se recuerda la preferencia del usuario en localStorage.
 * ============================================================
 */

const STORAGE_KEY = "estatus-theme";

export function initTheme(){

    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = saved || "dark"; // dark por defecto

    applyTheme(theme);

    document.getElementById("btn-theme-toggle")
        .addEventListener("click", toggleTheme);

}

function applyTheme(theme){

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const btn = document.getElementById("btn-theme-toggle");
    if(btn){
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
    }

}

function toggleTheme(){

    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");

}
