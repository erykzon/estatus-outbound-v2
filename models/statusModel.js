/**
 * ============================================================
 * Status Model
 * Estatus Outbound V2
 * Version: 2.0
 * ============================================================
 */
import MetricsEngine from "../services/metricsEngine.js";

function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;

    if (value === null || value === undefined) return false;

    const v = String(value).trim().toUpperCase();

    return (
        v === "SI" ||
        v === "SÍ" ||
        v === "YES" ||
        v === "TRUE" ||
        v === "1" ||
        v === "X"
    );
}

function normalizeNumber(value) {

    if (value === null || value === undefined || value === "")
        return 0;

    const n = Number(value);

    return isNaN(n) ? 0 : n;

}

function normalizeString(value) {

    if (value === null || value === undefined)
        return "";

    return String(value).trim();

}

function mapRow(row) {

    return {

        date: normalizeString(row.date),

        warehouse: normalizeString(row.warehouse),

        customer: normalizeString(row.customer),

        cn: normalizeString(row.cn),

        pieces: normalizeNumber(row.pieces),

        orderStatus: normalizeString(row.orderStatus),

        unitStatus: normalizeString(row.unitStatus),

        appointment: normalizeString(row.appointment),

        maxDeparture: normalizeString(row.maxDeparture),

        cut: normalizeString(row.cut),

        tiros: normalizeNumber(row.tiros),

        cat: normalizeString(row.cat),

        laser: normalizeBoolean(row.laser),

        armado: normalizeBoolean(row.armado),

        insumos: normalizeBoolean(row.insumos)

    };

}


export function createStatusModel(payload) {

    if (!payload)
        throw new Error("Payload is required.");

    const rows = Array.isArray(payload.rows)
        ? payload.rows.map(mapRow)
        : [];

    return {

        version: payload.version || "2.0",

        businessDate:
            normalizeString(payload.businessDate),

        generatedAt:
            payload.generatedAt ||
            new Date().toISOString(),

        generatedBy:
            normalizeString(payload.generatedBy),

        summary:
            MetricsEngine.calculate(rows),

        rows

    };

}
