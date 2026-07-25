/**
 * =========================================================
 * Proyecto : Estatus Outbound API
 * Archivo  : metricsEngine.js
 * Versión  : 1.0.0
 *
 * Motor de cálculo de KPIs.
 *
 * Responsabilidades:
 *  - Calcular métricas generales
 *  - Calcular indicadores operativos
 *  - Centralizar toda la lógica del Dashboard
 *
 * Todas las métricas nuevas deberán agregarse aquí.
 * =========================================================
 */

class MetricsEngine {

    /**
     * Punto de entrada
     */
    static calculate(rows = []) {

        return {

            ...this.general(rows),

            ...this.operations(rows)

        };

    }

    //========================================================
    // MÉTRICAS GENERALES
    //========================================================

    static general(rows) {

        const validCN = rows
            .map(r => this.normalize(r.cn))
            .filter(Boolean);

        const validCustomers = rows
            .map(r => this.normalize(r.customer))
            .filter(Boolean);

        const validWarehouses = rows
            .map(r => this.normalize(r.warehouse))
            .filter(Boolean);

        return {

            totalRecords: rows.length,

            totalCN: new Set(validCN).size,

            totalPieces: rows.reduce(
                (sum, row) => sum + (Number(row.pieces) || 0),
                0
            ),

            totalCustomers: new Set(validCustomers).size,

            totalWarehouses: new Set(validWarehouses).size

        };

    }

    //========================================================
    // MÉTRICAS OPERATIVAS
    //========================================================

    static operations(rows) {

        return {

            totalArmado: rows.filter(r => this.isTrue(r.armado)).length,

            totalLaser: rows.filter(r => this.isTrue(r.laser)).length

        };

    }

    //========================================================
    // NORMALIZADORES
    //========================================================

    static normalize(value) {

        if (value === null || value === undefined)
            return null;

        const text = String(value).trim();

        return text.length ? text : null;

    }

    static isTrue(value) {

        if (value === true)
            return true;

        if (value === false)
            return false;

        if (value === null || value === undefined)
            return false;

        const text = String(value)
            .trim()
            .toUpperCase();

        return [

            "SI",
            "SÍ",
            "YES",
            "TRUE",
            "1",
            "X",
            "PREMIUM"

        ].includes(text);

    }

}

export default MetricsEngine;