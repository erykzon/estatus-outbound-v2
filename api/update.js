/**
 * ============================================================
 * API - Update Status
 * Estatus Outbound V2
 * ============================================================
 */
import { createStatusModel } from "../models/statusModel.js";
import { saveStatus } from "../lib/storage.js";
import CONFIG from "../config/config.js";

function send(res, status, body) {
    res.status(status).json(body);
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return send(res, 405, {
            success: false,
            error: CONFIG.API.METHOD_NOT_ALLOWED
        });
    }

    // --------------------------------------------------------
    // Autenticacion simple por clave compartida
    // --------------------------------------------------------
    const providedKey = req.headers["x-upload-key"];
    const expectedKey = process.env.UPLOAD_SECRET;

    if (!expectedKey) {
        // Si no configuraste la variable de entorno, bloquea todo
        // por seguridad en vez de dejar el endpoint abierto.
        console.error("UPLOAD_SECRET no esta configurado en Vercel.");
        return send(res, 500, {
            success: false,
            error: "Server misconfigured: missing UPLOAD_SECRET."
        });
    }

    if (!providedKey || providedKey !== expectedKey) {
        return send(res, 401, {
            success: false,
            error: "Unauthorized: invalid or missing X-Upload-Key header."
        });
    }

    try {
        const payload = req.body;

        if (!payload) {
            return send(res, 400, {
                success: false,
                error: "Payload is required."
            });
        }

        if (!payload.businessDate) {
            return send(res, 400, {
                success: false,
                error: "businessDate is required."
            });
        }

        if (!Array.isArray(payload.rows)) {
            return send(res, 400, {
                success: false,
                error: "rows must be an array."
            });
        }

        //----------------------------------------
        // Construcción del modelo
        //----------------------------------------
        const model = createStatusModel(payload);

        //----------------------------------------
        // Guardar en Redis
        //----------------------------------------
        await saveStatus(model);

        //----------------------------------------
        // Respuesta
        //----------------------------------------
        return send(res, 200, {
            success: true,
            message: "Status stored successfully.",
            businessDate: model.businessDate,
            summary: model.summary,
            records: model.rows.length,
            generatedAt: model.generatedAt
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
