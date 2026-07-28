/**
 * ============================================================
 * State Store
 * Estatus Outbound V2
 *
 * Estado compartido entre todas las secciones (Operacion,
 * Riesgos, Preparacion, Graficas, Buscador). Evita que cada
 * modulo tenga que volver a pedir datos a la API o duplicar
 * logica de filtrado.
 * ============================================================
 */

export const store = {

    // Datos crudos tal como vienen de la API
    rawData: null,

    // Todas las filas (data.rows) sin filtrar
    allRows: [],

    // Filas despues de aplicar los filtros de Operacion (fecha/almacen)
    filteredRows: [],

    // Filtros activos
    filters: {
        dateStart: "",
        dateEnd: "",
        warehouse: ""
    }

};

export function setRawData(data){
    store.rawData = data;
    store.allRows = Array.isArray(data.rows) ? data.rows : [];
    store.filteredRows = store.allRows;
}

export function applyFilters({dateStart, dateEnd, warehouse}){

    store.filters = {dateStart, dateEnd, warehouse};

    store.filteredRows = store.allRows.filter(row => {

        if(dateStart || dateEnd){
            const rowDate = row.date ? row.date.split("T")[0] : "";
            if(dateStart && rowDate < dateStart) return false;
            if(dateEnd && rowDate > dateEnd) return false;
        }

        if(warehouse && row.warehouse !== warehouse) return false;

        return true;

    });

}

export function getWarehouseList(){
    return [...new Set(store.allRows.map(r => r.warehouse).filter(Boolean))].sort();
}

export function findRowsByCN(cn){
    return store.allRows.filter(r => r.cn === cn);
}
