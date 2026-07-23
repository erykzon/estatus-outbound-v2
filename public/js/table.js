/**
 * ============================================================
 * Table Controller
 * Estatus Outbound V2
 * ============================================================
 */

import { formatNumber } from "./utils.js";

function badgeStatus(status){

    switch(status){

        case "Liberado":
            return '<span class="badge success">Liberado</span>';

        case "Pendiente":
            return '<span class="badge warning">Pendiente</span>';

        default:
            return `<span class="badge">${status}</span>`;

    }

}

function badgeBoolean(value){

    return value
        ? '<span class="badge yes">SI</span>'
        : '<span class="badge no">NO</span>';

}

export function renderTable(rows){

    const tbody = document.getElementById("tableBody");

    tbody.innerHTML = "";

    rows.forEach(row=>{

        tbody.insertAdjacentHTML(
            "beforeend",
            `
            <tr>

                <td>${row.warehouse}</td>

                <td>${row.customer}</td>

                <td>${row.cn}</td>

                <td class="right">${formatNumber(row.pieces)}</td>

                <td>${badgeStatus(row.orderStatus)}</td>

                <td>${row.unitStatus}</td>

                <td>${row.appointment}</td>

                <td>${row.maxDeparture}</td>

                <td>${row.cut}</td>

                <td>${row.cat}</td>

                <td>${badgeBoolean(row.laser)}</td>

                <td>${badgeBoolean(row.armado)}</td>

                <td>${badgeBoolean(row.insumos)}</td>

            </tr>
            `
        );

    });

}
