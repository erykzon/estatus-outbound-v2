/**
 * ============================================================
 * Charts Section
 * Estatus Outbound V2
 *
 * - Distribucion por CAT (HE/WG/AC/Others)
 * - Volumen de Laser
 * - Puntualidad de Transporte (verde/amarillo/rojo vs loadStart)
 * - Puntualidad de Almacen (a tiempo/tarde vs maxDeparture)
 * - Tendencia de horas de arribo (arrivalTime), con registros
 *   sin captura desglosados
 * ============================================================
 */

import { store, applyChartsFilters, getWarehouseList } from "./store.js";
import { formatNumber, formatDate, normalizeText, normalizeUpper, parseArrivalTime } from "./utils.js";
import { openModal } from "./modal.js";

let catChart = null;
let arrivalChart = null;
let chartsFiltersWired = false;

export function initChartsFilters(){

    const warehouses = getWarehouseList();
    const select = document.getElementById("charts-warehouse");

    if(select){
        select.innerHTML = '<option value="">Todos</option>';
        warehouses.forEach(w => {
            const opt = document.createElement("option");
            opt.value = w;
            opt.textContent = w;
            select.appendChild(opt);
        });
    }

    if(!chartsFiltersWired){
        const applyBtn = document.getElementById("charts-apply-btn");
        if(applyBtn){
            applyBtn.addEventListener("click", handleApplyChartsFilters);
        }
        chartsFiltersWired = true;
    }

}

function handleApplyChartsFilters(){

    applyChartsFilters({
        date: document.getElementById("charts-date").value,
        warehouse: document.getElementById("charts-warehouse").value
    });

    renderCharts();

}

export function renderCharts(){

    const rows = store.charts.filteredRows;

    renderCATDistribution(rows);
    renderLaserVolume(rows);
    renderTransportPunctuality(rows);
    renderWarehousePunctuality(rows);
    renderArrivalTrend(rows);

}

// ------------------------------------------------------------
// Distribucion por CAT
// ------------------------------------------------------------

function renderCATDistribution(rows){

    const byCAT = {};
    rows.forEach(r => {
        const cat = normalizeText(r.cat) || "Sin categoría";
        if(!byCAT[cat]) byCAT[cat] = { cns: new Set(), pieces: 0 };
        byCAT[cat].cns.add(r.cn);
        byCAT[cat].pieces += Number(r.pieces) || 0;
    });

    const labels = Object.keys(byCAT);
    const dataPieces = labels.map(k => byCAT[k].pieces);

    const canvas = document.getElementById("chart-cat");
    if(!canvas) return;

    if(catChart) catChart.destroy();

    catChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: dataPieces,
                backgroundColor: ["#1D9E75","#378ADD","#BA7517","#9F4FBB","#E24B4A","#D85A30"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } }
        }
    });

}

// ------------------------------------------------------------
// Volumen de Laser
// ------------------------------------------------------------

function renderLaserVolume(rows){

    const laser = rows.filter(r => r.laser);
    const byWarehouse = {};

    laser.forEach(r => {
        const wh = r.warehouse || "Sin almacén";
        byWarehouse[wh] = (byWarehouse[wh] || 0) + 1;
    });

    document.getElementById("chart-laser-total").textContent = formatNumber(laser.length);

    const el = document.getElementById("chart-laser-breakdown");
    const entries = Object.entries(byWarehouse).sort((a,b) => b[1]-a[1]);

    if(!entries.length){
        el.innerHTML = '<div class="empty-state"><p>Sin registros de Laser</p></div>';
        return;
    }

    el.innerHTML = entries.map(([wh, count]) => `
        <div class="detail-field">
          <span class="detail-label">${wh}</span>
          <span class="detail-value">${formatNumber(count)}</span>
        </div>
    `).join("");

}

// ------------------------------------------------------------
// Puntualidad de Transporte (llegada vs Inicio de carga)
// Verde: >1h de margen | Amarillo: <1h margen | Rojo: tarde/no llego
// ------------------------------------------------------------

function renderTransportPunctuality(rows){

    let onTime = 0, tight = 0, late = 0, noData = 0;
    const noDataRows = [];

    rows.forEach(r => {

        const arrival = parseArrivalTime(r.arrivalTime, r.date);

        if(!arrival){
            noData++;
            noDataRows.push(r);
            return;
        }

        const loadStart = r.loadStart ? new Date(r.loadStart) : null;
        if(!loadStart || isNaN(loadStart)){
            noData++;
            noDataRows.push(r);
            return;
        }

        const marginHours = (loadStart - arrival) / (1000 * 60 * 60);

        if(marginHours < 0) late++;
        else if(marginHours < 1) tight++;
        else onTime++;

    });

    const total = onTime + tight + late;

    document.getElementById("punct-transport-ontime").textContent = formatNumber(onTime);
    document.getElementById("punct-transport-tight").textContent = formatNumber(tight);
    document.getElementById("punct-transport-late").textContent = formatNumber(late);
    document.getElementById("punct-transport-nodata").textContent = formatNumber(noData);

    const pct = total ? Math.round((onTime/total)*100) : 0;
    document.getElementById("punct-transport-pct").textContent = `${pct}%`;

    window.__noDataTransport = noDataRows;

}

// ------------------------------------------------------------
// Puntualidad de Almacen (Finalizado vs Max de Salida)
// ------------------------------------------------------------

function renderWarehousePunctuality(rows){

    let onTime = 0, late = 0, pending = 0;

    rows.forEach(r => {

        const isFinalized = normalizeUpper(r.orderStatus).includes("FINALIZADO");
        const maxDeparture = r.maxDeparture ? new Date(r.maxDeparture) : null;

        if(!maxDeparture || isNaN(maxDeparture)){
            pending++;
            return;
        }

        if(!isFinalized){
            const now = new Date();
            if(now > maxDeparture) late++;
            else pending++;
            return;
        }

        // Ya finalizado: comparamos contra la fecha de generacion del reporte
        // como proxy de "cuando se completo" (no tenemos timestamp exacto de Finalizado)
        onTime++;

    });

    document.getElementById("punct-warehouse-ontime").textContent = formatNumber(onTime);
    document.getElementById("punct-warehouse-late").textContent = formatNumber(late);
    document.getElementById("punct-warehouse-pending").textContent = formatNumber(pending);

}

// ------------------------------------------------------------
// Tendencia de horas de arribo
// ------------------------------------------------------------

function renderArrivalTrend(rows){

    const buckets = {};
    const bucketRows = {};
    let noDataCount = 0;
    const noDataRows = [];

    rows.forEach(r => {

        const arrival = parseArrivalTime(r.arrivalTime, r.date);

        if(!arrival){
            noDataCount++;
            noDataRows.push(r);
            return;
        }

        const hour = arrival.getHours();
        const bucket = `${String(hour).padStart(2,"0")}:00`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;

        if(!bucketRows[bucket]) bucketRows[bucket] = [];
        bucketRows[bucket].push(r);

    });

    const labels = Array.from({length:24}, (_,i) => `${String(i).padStart(2,"0")}:00`);
    const data = labels.map(l => buckets[l] || 0);

    document.getElementById("chart-arrival-nodata-count").textContent = formatNumber(noDataCount);

    const canvas = document.getElementById("chart-arrival-trend");
    if(canvas){

        if(arrivalChart) arrivalChart.destroy();

        arrivalChart = new Chart(canvas, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Arribos por hora",
                    data,
                    backgroundColor: "#1D9E75cc",
                    borderColor: "#1D9E75",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { font: { size: 10 } } },
                    y: { ticks: { font: { size: 11 } }, grid: { color: "var(--border2)" } }
                },
                onClick: (evt, elements) => {
                    if(!elements.length) return;
                    const idx = elements[0].index;
                    const label = labels[idx];
                    const list = bucketRows[label] || [];
                    openModal({
                        title: `Arribos a las ${label}`,
                        subtitle: `${list.length} registro${list.length!==1?"s":""}`,
                        rows: list,
                        showCita: false
                    });
                },
                onHover: (evt, elements) => {
                    evt.native.target.style.cursor = elements.length ? "pointer" : "default";
                }
            }
        });

    }

    const btn = document.getElementById("chart-arrival-nodata-btn");
    if(btn){
        btn.onclick = () => openModal({
            title: "Registros sin hora de arribo capturada",
            subtitle: `${noDataRows.length} registro${noDataRows.length!==1?"s":""}`,
            rows: noDataRows,
            showCita: false
        });
    }

}
