/**
 * ============================================================
 * Navigation
 * Estatus Outbound V2
 *
 * Controla el cambio entre las 4 secciones (Operacion,
 * Preparacion, Graficas, Riesgos). Un mismo estado maneja
 * tanto las tabs de desktop como el bottom-nav de movil.
 * ============================================================
 */

const SECTIONS = ["operation", "preparation", "charts", "risks"];

const onSectionChangeCallbacks = [];

export function onSectionChange(callback){
    onSectionChangeCallbacks.push(callback);
}

export function initNav(){

    document.querySelectorAll("[data-nav-section]").forEach(el => {
        el.addEventListener("click", () => {
            goToSection(el.dataset.navSection);
        });
    });

    goToSection("operation");

}

export function goToSection(sectionId){

    if(!SECTIONS.includes(sectionId)) return;

    document.querySelectorAll(".section").forEach(el => {
        el.classList.toggle("active", el.id === `section-${sectionId}`);
    });

    document.querySelectorAll("[data-nav-section]").forEach(el => {
        el.classList.toggle("active", el.dataset.navSection === sectionId);
    });

    onSectionChangeCallbacks.forEach(cb => cb(sectionId));

}
