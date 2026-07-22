import { redis } from "./redis.js";

const INDEX_KEY = "status:index";
const MAX_DATES = 15;

/**
 * Guarda la información de una fecha de operación.
 */
export async function saveStatus(payload) {

    const businessDate = payload.businessDate;

    if (!businessDate) {
        throw new Error("businessDate es obligatorio.");
    }

    const key = `status:${businessDate}`;

    // Guarda o reemplaza la información
    await redis.set(key, payload);

    // Obtiene el índice actual
    let index = await redis.get(INDEX_KEY);

    if (!Array.isArray(index)) {
        index = [];
    }

    // Elimina la fecha si ya existe
    index = index.filter(d => d !== businessDate);

    // Inserta al inicio
    index.unshift(businessDate);

    // Conserva solo las últimas 15 fechas
    while (index.length > MAX_DATES) {

        const oldDate = index.pop();

        await redis.del(`status:${oldDate}`);

    }

    // Guarda nuevamente el índice
    await redis.set(INDEX_KEY, index);

    return {
        success: true,
        businessDate
    };

}

/**
 * Devuelve una fecha específica.
 */
export async function getStatus(date) {

    return await redis.get(`status:${date}`);

}

/**
 * Devuelve la fecha más reciente.
 */
export async function getLatestStatus() {

    const index = await redis.get(INDEX_KEY);

    if (!Array.isArray(index) || index.length === 0) {

        return null;

    }

    return await getStatus(index[0]);

}

/**
 * Devuelve el índice completo.
 */
export async function listBusinessDates() {

    const index = await redis.get(INDEX_KEY);

    return Array.isArray(index) ? index : [];

}
