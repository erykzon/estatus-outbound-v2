/**
 * ============================================================
 * Preparation Section
 * Estatus Outbound V2
 *
 * Volumen informativo de Armado, UPC e Insumos (por almacen),
 * mas los listados de CNs compartidos y CNs rezagados.
 * ============================================================
 */

import { store } from "./store.js";
import { formatNumber, formatDate, normalizeText } from "./utils.js";
import { openModal } from "./modal.js";

export function renderPreparation(){

    const rows = store.allRows;

    renderVolumeCards(rows);
    renderSharedCNs(rows);
    renderDelayedCNs(rows);

}

function renderVolumeCards(rows){

    const armado = rows.filter(r => r.armado);
    const upc = rows.filter(r => r.upc);
    const insumos = rows.filter(r => r.insumos);

    document.getElementById("prep-armado-value").textContent = formatNumber(armado.length);
    document.getElementById("prep-upc-value").textContent = formatNumber(upc.length);
    document.getElementById("prep-insumos-value").textContent = formatNumber(insumos.length);

    const warehousesArmado = new Set(armado.map(r => r.warehouse)).size;
    const warehousesUpc = new Set(upc.map(r => r.warehouse)).size;
    const warehousesInsumos = new Set(insumos.map(r => r.warehouse)).size;

    document.getElementById("prep-armado-sub").textContent = `${warehousesArmado} almacén(es)`;
    document.getElementById("prep-upc-sub").textContent = `${warehousesUpc} almacén(es)`;
    document.getElementById("prep-insumos-sub").textContent = `${warehousesInsumos} almacén(es)`;

    const cardMap = [
        ["prep-armado-card", armado, "Armado"],
        ["prep-upc-card", upc, "Revisión UPC"],
        ["prep-insumos-card", insumos, "Insumos"]
    ];

    cardMap.forEach(([id, list, label]) => {
        const card = document.getElementById(id);
        if(card){
            card.style.cursor = "pointer";
            card.onclick = () => openModal({
                title: `CNs con ${label}`,
                subtitle: `${list.length} registro${list.length!==1?"s":""}`,
                rows: list,
                showCita: false
            });
        }
    });

}

function renderSharedCNs(rows){

    const shared = rows.filter(r => normalizeText(r.sharedWarehouse).toUpperCase() === "COMPARTIDO");

    const byCN = {};
    shared.forEach(r => {
        if(!byCN[r.cn]) byCN[r.cn] = new Set();
        byCN[r.cn].add(r.warehouse);
    });

    const el = document.getElementById("prep-shared-table");

    const cnList = Object.entries(byCN).filter(([cn, whs]) => whs.size > 1);

    if(!cnList.length){
        el.innerHTML = '<div class="empty-state"><p>Sin CNs compartidos en este momento</p></div>';
        return;
    }

    let rowsHtml = "";
    cnList.forEach(([cn, whs]) => {
        rowsHtml += `<tr><td>${cn}</td><td>${[...whs].join(", ")}</td></tr>`;
    });

    el.innerHTML = `
        <table>
          <thead><tr><th>CN</th><th>Almacenes</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
    `;

}

function renderDelayedCNs(rows){

    const todayISO = new Date().toISOString().split("T")[0];

    const delayed = rows.filter(r => {
        const rowDate = r.date ? r.date.split("T")[0] : "";
        const isFinalized = normalizeText(r.orderStatus).toUpperCase().includes("FINALIZADO");
        return rowDate && rowDate < todayISO && !isFinalized;
    });

    const el = document.getElementById("prep-delayed-table");

    document.getElementById("prep-delayed-count").textContent = delayed.length;

    if(!delayed.length){
        el.innerHTML = '<div class="empty-state"><p>Sin CNs rezagados</p></div>';
        return;
    }

    let rowsHtml = "";
    delayed.forEach(r => {
        rowsHtml += `
            <tr>
              <td>${formatDate(r.date)}</td>
              <td>${r.cn || "—"}</td>
              <td>${r.warehouse || "—"}</td>
              <td>${r.customer || "—"}</td>
              <td class="num">${formatNumber(r.pieces)}</td>
              <td>${r.orderStatus || "—"}</td>
            </tr>
        `;
    });

    el.innerHTML = `
        <table>
          <thead>
            <tr><th>Fecha</th><th>CN</th><th>Almacén</th><th>Cliente</th><th class="num">Piezas</th><th>Estatus</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
    `;

}
