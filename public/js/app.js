/**
 * ============================================================
 * Main Application
 * Estatus Outbound V2
 * ============================================================
 */

import {
    getLatestStatus
} from "./api.js";

import {
    updateDashboard
} from "./dashboard.js";

import {
    renderTable
} from "./table.js";

async function loadDashboard(){

    try{

        const response = await getLatestStatus();

        if(!response.success){

            alert("No se encontró información.");

            return;

        }

        updateDashboard(response.data);

        renderTable(response.data.rows);

    }
    catch(error){

        console.error(error);

        alert(error.message);

    }

}

document
    .getElementById("btnRefresh")
    .addEventListener("click", loadDashboard);

loadDashboard();
