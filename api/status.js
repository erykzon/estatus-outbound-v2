/**
 * ============================================================
 * API - Status
 * Estatus Outbound V2
 * ============================================================
 */

import {
    getLatestStatus,
    getStatus,
    listBusinessDates
} from "../lib/storage.js";

function send(res, status, body) {
    res.status(status).json(body);
}

export default async function handler(req, res) {

    if (req.method !== "GET") {

        return send(res, 405, {
            success: false,
            error: "Method Not Allowed"
        });

    }

    try {

        const { date } = req.query;

        //------------------------------------------------
        // Obtener fecha específica
        //------------------------------------------------

        if (date) {

            const status = await getStatus(date);

            if (!status) {

                return send(res, 404, {

                    success: false,

                    error: "Business date not found.",

                    businessDate: date

                });

            }

            return send(res, 200, {

                success: true,

                data: status

            });

        }

        //------------------------------------------------
        // Obtener último día
        //------------------------------------------------

        const latest = await getLatestStatus();

        if (!latest) {

            return send(res, 404, {

                success: false,

                error: "No data available."

            });

        }

        //------------------------------------------------
        // También devolver fechas disponibles
        //------------------------------------------------

        const dates = await listBusinessDates();

        return send(res, 200, {

            success: true,

            availableDates: dates,

            data: latest

        });

    }

    catch (error) {

        console.error(error);

        return send(res, 500, {

            success: false,

            error: error.message

        });

    }

}
