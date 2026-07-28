/**
 * ============================================================
 * Modal Component
 * Estatus Outbound V2
 *
 * Modal centrado reutilizable para mostrar listas de CN
 * (usado por Operacion al hacer clic en stat-boxes o celdas
 * de la tabla pivot).
 * ============================================================
 */

import { formatNumber, formatDateTime } from "./utils.js";

function ensureModalDOM(){

    if(document.getElementById("modal-overlay")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-overlay" id="modal-overlay">
          <div class="modal-box">
            <div class="modal-head">
              <div>
                <div class="modal-title" id="modal-title"></div>
                <div class="modal-sub" id="modal-sub"></div>
              </div>
              <button class="modal-close" id="modal-close-btn">✕</button>
            </div>
            <div class="modal-body" id="modal-body"></div>
          </div>
        </div>
    `);

    document.getElementById("modal-overlay")
        .addEventListener("click", (e) => {
            if(e.target.id === "modal-overlay") closeModal();
        });

    document.getElementById("modal-close-btn")
        .addEventListener("click", closeModal);
}

export function openModal({title, subtitle, rows, showCita = false}){

    ensureModalDOM();

    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-sub").textContent = subtitle;

    const body = document.getElementById("modal-body");

    if(!rows || !rows.length){
        body.innerHTML = '<div class="cn-empty">Sin registros</div>';
    } else {
        body.innerHTML = rows.map(r => `
            <div class="cn-row">
              <div class="cn-info">
                <span class="cn-maxsalida">Máx. salida: ${formatDateTime(r.maxDeparture)}</span>
                <span class="cn-id">${r.cn || "—"}</span>
                <span class="cn-cliente">${r.customer || "Sin cliente"}</span>
                ${showCita ? `<span class="cn-cita">Cita: ${formatDateTime(r.appointment)}</span>` : ""}
              </div>
              <span class="cn-piezas">${formatNumber(r.pieces)} pz</span>
            </div>
        `).join("");
    }

    document.getElementById("modal-overlay").classList.add("open");

}

export function closeModal(){
    const overlay = document.getElementById("modal-overlay");
    if(overlay) overlay.classList.remove("open");
}
