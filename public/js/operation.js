/**
 * ============================================================
 * Operation Section
 * Estatus Outbound V2
 *
 * Tarjetas por almacen (CNs/Embarcado/En proceso/Por arribar)
 * + tabla pivot Estatus CN vs Estatus Unidades.
 * Paridad completa con la v1 (oms_review_app.html).
 * ============================================================
 */

import { store, applyOperationFilters, getWarehouseList } from "./store.js";
import { formatNumber } from "./utils.js";
import { openModal } from "./modal.js";

const EU_ORDER = ["POR ARRIBAR", "ARRIBADO", "RAMPA", "EMBARCADO"];

let pivotRowsStore = {};
let warehouseRowsStore = {};

export function initOperationFilters(){

    const warehouses = getWarehouseList();

    const select = document.getElementById("op-warehouse");
    select.innerHTML = '<option value="">Todos</option>';
    warehouses.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        select.appendChild(opt);
    });

    const todayISO = new Date().toISOString().split("T")[0];
    document.getElementById("op-date-start").value = todayISO;
    document.getElementById("op-date-end").value = todayISO;

    document.getElementById("op-apply-btn")
        .addEventListener("click", handleApplyFilters);
}

function handleApplyFilters(){

    applyOperationFilters({
        dateStart: document.getElementById("op-date-start").value,
        dateEnd: document.getElementById("op-date-end").value,
        warehouse: document.getElementById("op-warehouse").value
    });

    renderOperation();

}

export function renderOperation(){

    const rows = store.operation.filteredRows;

    renderKPIs(rows);
    renderWarehouseCards(rows);
    renderPivotTable(rows);

}

function renderKPIs(rows){

    const cns = new Set(rows.map(r => r.cn)).size;
    const pieces = rows.reduce((s, r) => s + (Number(r.pieces) || 0), 0);
    const embarcado = rows.filter(r => (r.unitStatus||"").toUpperCase() === "EMBARCADO").length;
    const porArribar = rows.filter(r => (r.unitStatus||"").toUpperCase() === "POR ARRIBAR").length;

    document.getElementById("op-kpi-cns").textContent = formatNumber(cns);
    document.getElementById("op-kpi-pieces").textContent = formatNumber(pieces);
    document.getElementById("op-kpi-embarcado").textContent = formatNumber(embarcado);
    document.getElementById("op-kpi-porarribar").textContent = formatNumber(porArribar);

}

function renderWarehouseCards(rows){

    const el = document.getElementById("op-warehouse-grid");

    const byWarehouse = {};

    rows.forEach(r => {
        const wh = r.warehouse || "Sin almacén";
        const eu = (r.unitStatus || "").toUpperCase();

        if(!byWarehouse[wh]){
            byWarehouse[wh] = {
                cns: new Set(), pieces: 0, total: 0,
                embarcado: 0, porArribar: 0, arribado: 0, rampa: 0,
                rows: []
            };
        }

        byWarehouse[wh].cns.add(r.cn);
        byWarehouse[wh].pieces += Number(r.pieces) || 0;
        byWarehouse[wh].total++;
        if(eu === "EMBARCADO") byWarehouse[wh].embarcado++;
        if(eu === "POR ARRIBAR") byWarehouse[wh].porArribar++;
        if(eu === "ARRIBADO") byWarehouse[wh].arribado++;
        if(eu === "RAMPA") byWarehouse[wh].rampa++;
        byWarehouse[wh].rows.push(r);
    });

    warehouseRowsStore = {};

    let html = "";
    let idx = 0;

    Object.entries(byWarehouse)
        .sort((a,b) => b[1].pieces - a[1].pieces)
        .forEach(([wh, d]) => {

            idx++;
            const cardId = "wh" + idx;
            const pct = d.total ? Math.round((d.embarcado / d.total) * 100) : 0;

            let badge, badgeClass;
            if(d.porArribar === 0){ badge = "Sin pendientes"; badgeClass = "badge-ok"; }
            else if(pct >= 70){ badge = `${d.porArribar} por arribar`; badgeClass = "badge-warn"; }
            else { badge = `${d.porArribar} por arribar`; badgeClass = "badge-bad"; }

            warehouseRowsStore[cardId] = d.rows;

            html += `
              <div class="alm-card">
                <div class="alm-head">
                  <div>
                    <div class="alm-name-row">
                      <span class="alm-name">${wh}</span>
                      <span class="alm-piezas">${formatNumber(d.pieces)} pzs</span>
                    </div>
                  </div>
                  <span class="badge ${badgeClass}">${badge}</span>
                </div>
                <div class="alm-stats">
                  <div class="stat" data-card="${cardId}" data-kind="all">
                    <div class="stat-v">${d.cns.size}</div><div class="stat-l">CNs</div>
                  </div>
                  <div class="stat" data-card="${cardId}" data-kind="embarcado">
                    <div class="stat-v" style="color:var(--teal)">${d.embarcado}</div><div class="stat-l">Embarcado</div>
                  </div>
                  <div class="stat" data-card="${cardId}" data-kind="enProceso">
                    <div class="stat-v" style="color:var(--amber)">${d.arribado + d.rampa}</div><div class="stat-l">En proceso</div>
                  </div>
                  <div class="stat" data-card="${cardId}" data-kind="porArribar">
                    <div class="stat-v" style="color:${d.porArribar>0?'var(--red)':'var(--text2)'}">${d.porArribar}</div><div class="stat-l">Por arribar</div>
                  </div>
                </div>
                <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
                <div class="prog-labels"><span>${pct}% embarcado</span></div>
              </div>
            `;

        });

    el.innerHTML = html || '<div class="empty-state"><p>Sin datos para los filtros seleccionados</p></div>';

    el.querySelectorAll(".stat").forEach(stat => {
        stat.addEventListener("click", () => {
            openWarehouseStatModal(stat.dataset.card, stat.dataset.kind);
        });
    });

}

function openWarehouseStatModal(cardId, kind){

    const rows = warehouseRowsStore[cardId] || [];
    let list, title;

    if(kind === "all"){
        const seen = new Set();
        list = rows.filter(r => {
            if(seen.has(r.cn)) return false;
            seen.add(r.cn);
            return true;
        });
        title = "Todos los CNs";
    } else if(kind === "embarcado"){
        list = rows.filter(r => (r.unitStatus||"").toUpperCase() === "EMBARCADO");
        title = "CNs Embarcados";
    } else if(kind === "enProceso"){
        list = rows.filter(r => {
            const eu = (r.unitStatus||"").toUpperCase();
            return eu === "ARRIBADO" || eu === "RAMPA";
        });
        title = "CNs En proceso";
    } else {
        list = rows.filter(r => (r.unitStatus||"").toUpperCase() === "POR ARRIBAR");
        title = "CNs Por arribar";
    }

    const wh = rows[0] ? rows[0].warehouse : "";

    openModal({
        title,
        subtitle: `${wh} · ${list.length} registro${list.length !== 1 ? "s" : ""}`,
        rows: list,
        showCita: kind === "all"
    });

}

function renderPivotTable(rows){

    const epSet = new Set(rows.map(r => r.orderStatus).filter(Boolean));
    const epList = [...epSet].sort((a,b) => (parseInt(a)||999) - (parseInt(b)||999));

    const euSet = new Set(rows.map(r => (r.unitStatus||"").toUpperCase()).filter(Boolean));
    const euList = EU_ORDER.filter(e => euSet.has(e));
    euSet.forEach(e => { if(!EU_ORDER.includes(e)) euList.push(e); });

    const pivot = {};
    pivotRowsStore = {};

    rows.forEach(r => {
        const ep = r.orderStatus || "";
        const eu = (r.unitStatus || "").toUpperCase();
        if(!pivot[ep]) pivot[ep] = {};
        pivot[ep][eu] = (pivot[ep][eu] || 0) + 1;

        const key = ep + "|||" + eu;
        if(!pivotRowsStore[key]) pivotRowsStore[key] = [];
        pivotRowsStore[key].push(r);
    });

    const grandTotal = rows.length;

    let thead = `<tr><th>Estatus CN</th>`;
    euList.forEach(eu => { thead += `<th class="num">${eu}</th>`; });
    thead += `<th class="num">TOTAL</th><th class="num">%</th></tr>`;

    let tbody = "";

    epList.forEach(ep => {
        const row = pivot[ep] || {};
        const rowTotal = Object.values(row).reduce((s,v) => s+v, 0);
        const pct = grandTotal ? Math.round((rowTotal/grandTotal)*100) : 0;

        tbody += `<tr><td>${ep}</td>`;
        euList.forEach(eu => {
            const v = row[eu];
            tbody += v ? `<td class="num">${v}</td>` : `<td class="dash num">—</td>`;
        });
        tbody += `<td class="num" style="font-weight:700">${rowTotal}</td><td class="num" style="color:var(--text2)">${pct}%</td></tr>`;
    });

    tbody += '<tr class="total-row"><td>Total general</td>';
    const colTotals = {};
    euList.forEach(eu => {
        const t = rows.filter(r => (r.unitStatus||"").toUpperCase() === eu).length;
        colTotals[eu] = t;
        tbody += `<td class="num">${t}</td>`;
    });
    tbody += `<td class="num">${grandTotal}</td><td class="num">100%</td></tr>`;

    tbody += '<tr class="pct-row"><td>%</td>';
    euList.forEach(eu => {
        const pct = grandTotal ? Math.round((colTotals[eu]/grandTotal)*100) : 0;
        tbody += `<td class="num">${pct}%</td>`;
    });
    tbody += '<td></td><td></td></tr>';

    document.getElementById("op-pivot-table").innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;

    attachPivotCellHandlers(epList, euList, pivot);

}

function attachPivotCellHandlers(epList, euList, pivot){

    const tbody = document.querySelector("#op-pivot-table tbody");
    const trs = tbody.querySelectorAll("tr");

    epList.forEach((ep, rowIdx) => {
        const tr = trs[rowIdx];
        if(!tr) return;
        const cells = tr.querySelectorAll("td.num");

        euList.forEach((eu, colIdx) => {
            const cell = cells[colIdx];
            if(!cell) return;
            const val = pivot[ep] ? pivot[ep][eu] : null;
            if(val){
                cell.style.cursor = "pointer";
                cell.style.textDecoration = "underline";
                cell.style.textDecorationColor = "transparent";
                cell.addEventListener("mouseenter", () => cell.style.textDecorationColor = "var(--teal-dark)");
                cell.addEventListener("mouseleave", () => cell.style.textDecorationColor = "transparent");
                cell.addEventListener("click", () => {
                    const key = ep + "|||" + eu;
                    const list = pivotRowsStore[key] || [];
                    openModal({
                        title: ep,
                        subtitle: `${eu} · ${list.length} registro${list.length!==1?"s":""}`,
                        rows: list,
                        showCita: false
                    });
                });
            }
        });
    });

}
