/**
 * ============================================================
 * Search Section
 * Estatus Outbound V2
 *
 * Buscador global (header) + panel deslizable lateral (drawer)
 * con el detalle de un CN. Si el CN esta "vivo" muestra el
 * paquete basico de datos; si ya "cerro" (Finalizado o
 * Embarcado) agrega metricas retrospectivas. Incluye boton
 * expandible para ver el detalle de Modelos (via RawData).
 * ============================================================
 */

import { store, findRowsByCN } from "./store.js";
import { formatNumber, formatDate, formatDateTime, normalizeUpper, hoursUntil } from "./utils.js";

function ensureDrawerDOM(){

    if(document.getElementById("drawer-overlay")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div class="drawer-overlay" id="drawer-overlay"></div>
        <div class="drawer" id="drawer">
          <div class="drawer-head">
            <div>
              <div class="modal-title" id="drawer-title"></div>
              <div class="modal-sub" id="drawer-sub"></div>
            </div>
            <button class="modal-close" id="drawer-close-btn">✕</button>
          </div>
          <div class="drawer-body" id="drawer-body"></div>
        </div>
    `);

    document.getElementById("drawer-overlay").addEventListener("click", closeDrawer);
    document.getElementById("drawer-close-btn").addEventListener("click", closeDrawer);

}

export function initSearch(){

    ensureDrawerDOM();

    const input = document.getElementById("global-search-input");
    if(!input) return;

    input.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
            const cn = input.value.trim();
            if(cn) openCNDetail(cn);
        }
    });

}

function openDrawer(){
    document.getElementById("drawer-overlay").classList.add("open");
    document.getElementById("drawer").classList.add("open");
}

function closeDrawer(){
    document.getElementById("drawer-overlay").classList.remove("open");
    document.getElementById("drawer").classList.remove("open");
}

function isClosed(row){
    const orderStatus = normalizeUpper(row.orderStatus);
    const unitStatus = normalizeUpper(row.unitStatus);
    return orderStatus.includes("FINALIZADO") || unitStatus === "EMBARCADO";
}

function openCNDetail(cn){

    const matches = findRowsByCN(cn);

    if(!matches.length){
        document.getElementById("drawer-title").textContent = `CN ${cn}`;
        document.getElementById("drawer-sub").textContent = "No encontrado";
        document.getElementById("drawer-body").innerHTML =
            '<div class="cn-empty">No se encontró ningún registro con ese CN</div>';
        openDrawer();
        return;
    }

    const row = matches[0];
    const closed = isClosed(row);

    document.getElementById("drawer-title").textContent = `CN ${row.cn}`;
    document.getElementById("drawer-sub").textContent = closed ? "Cerrado" : "En curso";

    let html = `
        <div class="detail-field"><span class="detail-label">Fecha</span><span class="detail-value">${formatDate(row.date)}</span></div>
        <div class="detail-field"><span class="detail-label">Hora Unidades</span><span class="detail-value">${row.arrivalTime || "—"}</span></div>
        <div class="detail-field"><span class="detail-label">Estatus Unidades</span><span class="detail-value">${row.unitStatus || "—"}</span></div>
        <div class="detail-field"><span class="detail-label">Estatus del pedido</span><span class="detail-value">${row.orderStatus || "—"}</span></div>
        <div class="detail-field"><span class="detail-label">Almacén</span><span class="detail-value">${row.warehouse || "—"}</span></div>
        <div class="detail-field"><span class="detail-label">Piezas</span><span class="detail-value">${formatNumber(row.pieces)}</span></div>
        <div class="detail-field"><span class="detail-label">Cliente</span><span class="detail-value">${row.customer || "—"}</span></div>
        <div class="detail-field"><span class="detail-label">Max de Salida</span><span class="detail-value">${formatDateTime(row.maxDeparture)}</span></div>
        <div class="detail-field"><span class="detail-label">Fecha y Hora de Cita</span><span class="detail-value">${formatDateTime(row.appointment)}</span></div>
    `;

    if(closed){

        html += `<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border2)">
            <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Métricas retrospectivas</div>
        `;

        // Riesgo alcanzado en algun momento (segun estado final de maxDeparture)
        const maxHours = hoursUntil(row.maxDeparture);
        const reachedRisk = maxHours !== null && maxHours <= 4;

        html += `
            <div class="detail-field"><span class="detail-label">¿Llegó a estar en Riesgo?</span><span class="detail-value">${reachedRisk ? "Sí" : "No"}</span></div>
        `;

        html += `</div>`;

    }

    // Modelos (expandible)
    const models = row.models || [];

    html += `
        <div class="expand-toggle">
          <button class="expand-btn" id="drawer-expand-btn">
            Ver modelos (${models.length}) <span class="chev">▾</span>
          </button>
          <div class="expand-content" id="drawer-expand-content">
            ${models.length
                ? models.map(m => `<div class="model-row"><span>${m.model}</span><span>${formatNumber(m.pieces)} pz</span></div>`).join("")
                : '<div class="cn-empty">Sin detalle de modelos disponible</div>'
            }
          </div>
        </div>
    `;

    document.getElementById("drawer-body").innerHTML = html;

    const expandBtn = document.getElementById("drawer-expand-btn");
    const expandContent = document.getElementById("drawer-expand-content");
    expandBtn.addEventListener("click", () => {
        expandBtn.classList.toggle("open");
        expandContent.classList.toggle("open");
    });

    openDrawer();

}
