/**
 * ============================================================
 * Utilities
 * Estatus Outbound V2
 * ============================================================
 */

export function formatNumber(value){

    return Number(value).toLocaleString("es-MX");

}

export function formatDate(date){

    return new Date(date).toLocaleDateString("es-MX");

}

export function formatDateTime(date){

    return new Date(date).toLocaleString("es-MX");

}
