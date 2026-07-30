/**
 * ============================================================
 * Risks Section
 * Estatus Outbound V2
 *
 * Clasifica cada CN en una sola tarjeta de riesgo:
 *   1. Alerta Maxima   — maxDeparture en fase de riesgo (<=4h)
 *   2. Riesgo Almacen  — ya llego (Arribado/Rampa), no Finalizado,
 *                        maxDeparture fuera de riesgo
 *   3. Riesgo Transporte — no ha llegado (Por Arribar),
 *                        loadStart en fase de riesgo,
 *                        maxDeparture fuera de riesgo
 *
 * Exclusion previa (aplica a las 3): Estatus Cancelado/
 * Reprogramado, o Modalidad de Entrega en la lista de excepciones.
 * ============================================================
 */

import { store } from "./store.js";
import { formatNumber, formatDateTime, hoursUntil, riskPhase, phaseColor, phaseFillPercent, normalizeUpper } from "./utils.js";
import { openModal } from "./modal.js";

const EXCLUDED_ORDER_STATUS = ["1-CANCELADO", "12-REPROGRAMADO"];

const EXCLUDED_DELIVERY_MODES = [
    "CLIENTE RECOGE", "BACKHAUL", "BAZ", "WEPAY", "DSV", "VENDOR FLEX"
];

function isExcluded(row){

    const orderStatus = normalizeUpper(row.orderStatus);
    if(EXCLUDED_ORDER_STATUS.includes(orderStatus)) return true;

    const deliveryMode = normalizeUpper(row.deliveryMode);
    if(EXCLUDED_DELIVERY_MODES.includes(deliveryMode)) return true;

    return false;

}

/**
 * Clasifica todas las filas en las 3 categorias de riesgo.
 * Cada fila cae en UNA sola categoria, con esta prioridad:
 *   1) Alerta Maxima (maxDeparture <=4h, sin importar estatus)
 *   2) Riesgo Almacen (ya llego, no finalizado)
 *   3) Riesgo Transporte (no ha llegado, loadStart <=4h)
 */
function classifyRisks(rows){

    const maxAlert = [];
    const warehouseRisk = [];
    const transportRisk = [];
    const unclassified = [];

    rows.forEach(row => {

        if(isExcluded(row)){
            unclassified.push({row, reason: "Excluido (Cancelado/Reprogramado o Modalidad especial)"});
            return;
        }

        const eu = normalizeUpper(row.unitStatus);
        const hasArrived = eu === "ARRIBADO" || eu === "RAMPA";
        const isFinalized = normalizeUpper(row.orderStatus).includes("FINALIZADO");

        const maxHours = hoursUntil(row.maxDeparture);
        const maxPhase = riskPhase(maxHours);

        // 1. Alerta Maxima — manda sobre todo lo demas
        if(maxPhase !== null){
            maxAlert.push({
                row,
                phase: maxPhase,
                hours: maxHours,
                responsible: hasArrived ? "almacen" : "transporte"
            });
            return;
        }

        // 2. Riesgo de Almacen
        if(hasArrived && !isFinalized){
            warehouseRisk.push({ row, phase: null, hours: null });
            return;
        }

        // 3. Riesgo de Transporte
        if(eu === "POR ARRIBAR"){
            const loadHours = hoursUntil(row.loadStart);
            const loadPhase = riskPhase(loadHours);
            if(loadPhase !== null){
                transportRisk.push({ row, phase: loadPhase, hours: loadHours });
                return;
            }
            unclassified.push({row, reason: `Por Arribar pero loadStart fuera de riesgo (${loadHours !== null ? loadHours.toFixed(1)+"h restantes" : "fecha invalida"})`});
            return;
        }

        if(hasArrived && isFinalized){
            unclassified.push({row, reason: "Ya llegó y está Finalizado (sin riesgo)"});
            return;
        }

        unclassified.push({row, reason: `Estatus Unidades no reconocido: "${row.unitStatus}"`});

    });

    // Ordenar cada lista por urgencia (menos horas primero)
    const byUrgency = (a, b) => (a.hours ?? 999) - (b.hours ?? 999);
    maxAlert.sort(byUrgency);
    transportRisk.sort(byUrgency);

    return { maxAlert, warehouseRisk, transportRisk, unclassified };

}

export function renderRisks(){

    const rows = store.allRows; // Riesgos evalua TODOS los datos, no solo el filtro de fecha de Operacion

    const { maxAlert, warehouseRisk, transportRisk, unclassified } = classifyRisks(rows);

    document.getElementById("risk-max-count").textContent = maxAlert.length;
    document.getElementById("risk-almacen-count").textContent = warehouseRisk.length;
    document.getElementById("risk-transporte-count").textContent = transportRisk.length;

    renderRiskList("risk-max-list", maxAlert, {showRole: true});
    renderRiskList("risk-almacen-list", warehouseRisk, {showRole: false, staticPhase: "amber"});
    renderRiskList("risk-transporte-list", transportRisk, {showRole: false});

    // Diagnostico: abre la consola del navegador y escribe
    // debugRiskCN("2607044187") para ver por que un CN especifico
    // no aparece en ninguna tarjeta de riesgo.
    window.debugRiskCN = (cn) => {
        const match = unclassified.find(u => u.row.cn === cn);
        if(match){
            console.log(`CN ${cn} — Sin clasificar. Razón: ${match.reason}`);
            console.log("Datos completos:", match.row);
        } else {
            const inMax = maxAlert.find(i => i.row.cn === cn);
            const inAlm = warehouseRisk.find(i => i.row.cn === cn);
            const inTra = transportRisk.find(i => i.row.cn === cn);
            if(inMax) console.log(`CN ${cn} está en Alerta Máxima`, inMax);
            else if(inAlm) console.log(`CN ${cn} está en Riesgo de Almacén`, inAlm);
            else if(inTra) console.log(`CN ${cn} está en Riesgo de Transporte`, inTra);
            else console.log(`CN ${cn} no se encontró en los datos cargados.`);
        }
    };

}

function renderRiskList(elementId, items, {showRole, staticPhase}){

    const el = document.getElementById(elementId);

    if(!items.length){
        el.innerHTML = '<div class="risk-empty">Sin CNs en esta categoría</div>';
        return;
    }

    el.innerHTML = items.map(item => {

        const phase = staticPhase || item.phase || "green";
        const color = phaseColor(phase);
        const fillPct = item.hours !== null && item.hours !== undefined
            ? phaseFillPercent(item.hours, item.phase)
            : 60; // valor fijo para Riesgo de Almacen (sin cuenta regresiva)

        const isExpired = phase === "expired";
        const departureText = isExpired
            ? `Vencido · salida máx ${formatDateTime(item.row.maxDeparture)}`
            : `Salida máx ${formatDateTime(item.row.maxDeparture)}`;

        const tooltip = item.hours !== null && item.hours !== undefined
            ? `${item.hours > 0 ? item.hours.toFixed(1)+" hrs restantes" : "Vencido hace "+Math.abs(item.hours).toFixed(1)+" hrs"} · Cita: ${formatDateTime(item.row.appointment)}`
            : `Cita: ${formatDateTime(item.row.appointment)}`;

        const roleTag = showRole
            ? `<span class="risk-role-tag ${item.responsible}">${item.responsible === "almacen" ? "Almacén" : "Transporte"}</span>`
            : "";

        return `
          <div class="risk-card" title="${tooltip}" data-cn="${item.row.cn}">
            <div class="risk-accent">
              <div class="risk-accent-fill" style="height:${fillPct}%;background:${color}"></div>
            </div>
            <div class="risk-body">
              <div class="risk-row-top">
                <span class="risk-cn">${item.row.cn || "—"}</span>
                <span class="risk-pieces">${formatNumber(item.row.pieces)} pz</span>
              </div>
              <div class="risk-sub">${item.row.warehouse || "—"} · ${item.row.customer || "—"}</div>
              <div class="risk-departure ${isExpired ? "expired" : ""}">${departureText}</div>
              ${roleTag}
            </div>
          </div>
        `;

    }).join("");

    el.querySelectorAll(".risk-card").forEach(card => {
        card.addEventListener("click", () => {
            const cn = card.dataset.cn;
            const row = store.allRows.find(r => r.cn === cn);
            if(row){
                openModal({
                    title: `CN ${cn}`,
                    subtitle: `${row.warehouse} · ${row.customer}`,
                    rows: [row],
                    showCita: true
                });
            }
        });
    });

}
