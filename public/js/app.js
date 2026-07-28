/**
 * ============================================================
 * Main Application
 * Estatus Outbound V2
 *
 * Orquesta la carga de datos y conecta todos los modulos:
 * navegacion, tema, operacion, riesgos, preparacion, graficas
 * y buscador.
 * ============================================================
 */

import { getLatestStatus } from "./api.js";
import { setRawData } from "./store.js";
import { formatDate, formatDateTime } from "./utils.js";
import { initTheme } from "./theme.js";
import { initNav, onSectionChange } from "./nav.js";
import { initOperationFilters, renderOperation } from "./operation.js";
import { renderRisks } from "./risks.js";
import { renderPreparation } from "./preparation.js";
import { renderCharts, initChartsFilters } from "./charts.js";
import { initSearch } from "./search.js";

async function loadDashboard(){

    try{

        const response = await getLatestStatus();

        if(!response.success){
            alert("No se encontró información.");
            return;
        }

        setRawData(response.data);

        document.getElementById("businessDate").textContent =
            formatDate(response.data.businessDate);

        document.getElementById("generatedAt").textContent =
            formatDateTime(response.data.generatedAt);

        initOperationFilters();
        renderOperation();

        // Las demas secciones se renderizan la primera vez que
        // se visitan (ver onSectionChange abajo), para no
        // recalcular todo de golpe al cargar.

    }
    catch(error){
        console.error(error);
        alert(error.message);
    }

}

// ------------------------------------------------------------
// Render bajo demanda: cada seccion se calcula la primera vez
// que el usuario navega a ella, evitando trabajo innecesario
// al cargar la app.
// ------------------------------------------------------------

const renderedSections = new Set();

onSectionChange((sectionId) => {

    if(renderedSections.has(sectionId)) return;

    if(sectionId === "risks"){
        renderRisks();
        renderedSections.add("risks");
    }

    if(sectionId === "preparation"){
        renderPreparation();
        renderedSections.add("preparation");
    }

    if(sectionId === "charts"){
        initChartsFilters();
        renderCharts();
        renderedSections.add("charts");
    }

});

// ------------------------------------------------------------
// Inicializacion
// ------------------------------------------------------------

initTheme();
initNav();
initSearch();

document.getElementById("btnRefresh")
    .addEventListener("click", () => {
        renderedSections.clear();
        loadDashboard();
    });

loadDashboard();
