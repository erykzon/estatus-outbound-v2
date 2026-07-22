/**
 * ============================================================
 * Table Controller
 * Estatus Outbound V2
 * ============================================================
 */

import { formatNumber } from "./utils.js";

export function renderTable(rows) {

    const tbody = document.getElementById("tableBody");

    tbody.innerHTML = "";

    rows.forEach(row => {

        tbody.insertAdjacentHTML(
            "beforeend",
            `
            <tr>

                <td>${row.warehouse}</td>

                <td>${row.customer}</td>

                <td>${row.cn}</td>

                <td>${formatNumber(row.pieces)}</td>

                <td>${row.orderStatus}</td>

                <td>${row.unitStatus}</td>

                <td>${row.appointment}</td>

                <td>${row.maxDeparture}</td>

            </tr>
            `
        );

    });

}
