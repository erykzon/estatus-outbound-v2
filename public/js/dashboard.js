/**
 * ============================================================
 * Dashboard Controller
 * Estatus Outbound V2
 * ============================================================
 */

import { formatDate, formatDateTime, formatNumber } from "./utils.js";

export function updateDashboard(data) {

    const summary = data.summary;

    document.getElementById("businessDate").textContent =
        formatDate(data.businessDate);

    document.getElementById("generatedAt").textContent =
        formatDateTime(data.generatedAt);

    document.getElementById("kpiCN").textContent =
        formatNumber(summary.totalCN);

    document.getElementById("kpiPieces").textContent =
        formatNumber(summary.totalPieces);

    document.getElementById("kpiCustomers").textContent =
        formatNumber(summary.totalCustomers);

    document.getElementById("kpiWarehouses").textContent =
        formatNumber(summary.totalWarehouses);

    document.getElementById("kpiArmado").textContent =
        formatNumber(summary.totalArmado);

    document.getElementById("kpiLaser").textContent =
        formatNumber(summary.totalLaser);

}
