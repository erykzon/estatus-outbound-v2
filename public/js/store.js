/**
 * ============================================================
 * State Store
 * Estatus Outbound V2
 *
 * Estado compartido entre todas las secciones. IMPORTANTE:
 * cada seccion tiene su PROPIO estado de filtros, totalmente
 * independiente de las demas. No existe un filtro "global"
 * que afecte a todas las secciones a la vez.
 * ============================================================
 */

export const store = {

    // Datos crudos tal como vienen de la API (sin filtrar, nunca se modifica)
    rawData: null,
    allRows: [],

    // Cada seccion mantiene su propio resultado filtrado
    operation: {
        filteredRows: [],
        filters: { dateStart: "", dateEnd: "", warehouse: "" }
    },

    preparation: {
        filteredRows: [],
        filters: { dateStart: "", dateEnd: "", warehouse: "" }
    },

    charts: {
        filteredRows: [],
        filters: { date: "", warehouse: "" }
    }

    // Riesgos NO tiene filtro de fecha/almacen: siempre evalua
    // todos los datos, ya que su proposito es alertar sin
    // importar el periodo que se este revisando en otras secciones.

};

export function setRawData(data){
    store.rawData = data;
    store.allRows = Array.isArray(data.rows) ? data.rows : [];

    // Al cargar datos nuevos, cada seccion arranca sin filtrar
    store.operation.filteredRows = store.allRows;
    store.preparation.filteredRows = store.allRows;
    store.charts.filteredRows = store.allRows;
}

function matchesFilters(row, {dateStart, dateEnd, date, warehouse}){

    const rowDate = row.date ? row.date.split("T")[0] : "";

    if(date && rowDate !== date) return false;

    if(dateStart || dateEnd){
        if(dateStart && rowDate < dateStart) return false;
        if(dateEnd && rowDate > dateEnd) return false;
    }

    if(warehouse && row.warehouse !== warehouse) return false;

    return true;

}

export function applyOperationFilters(filters){
    store.operation.filters = filters;
    store.operation.filteredRows = store.allRows.filter(r => matchesFilters(r, filters));
}

export function applyPreparationFilters(filters){
    store.preparation.filters = filters;
    store.preparation.filteredRows = store.allRows.filter(r => matchesFilters(r, filters));
}

export function applyChartsFilters(filters){
    store.charts.filters = filters;
    store.charts.filteredRows = store.allRows.filter(r => matchesFilters(r, filters));
}

export function getWarehouseList(){
    return [...new Set(store.allRows.map(r => r.warehouse).filter(Boolean))].sort();
}

export function findRowsByCN(cn){
    return store.allRows.filter(r => r.cn === cn);
}
