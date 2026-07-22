/**
 * ============================================================
 * Storage Layer
 * Estatus Outbound V2
 * ============================================================
 */

import { redis } from "./redis.js";

import CONFIG from "../config/config.js";

const INDEX_KEY = CONFIG.REDIS.INDEX_KEY;

function buildKey(businessDate){

    return CONFIG.REDIS.PREFIX + businessDate;

}

async function saveIndex(index) {
    await redis.set(INDEX_KEY, JSON.stringify(index));
}

async function loadIndex() {

    const raw = await redis.get(INDEX_KEY);

    if (!raw)
        return [];

    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }

}

export async function saveStatus(status) {

    if (!status.businessDate)
        throw new Error("businessDate is required.");

    const key = buildKey(status.businessDate);

    await redis.set(
        key,
        JSON.stringify(status)
    );

    let index = await loadIndex();

    index = index.filter(
        d => d !== status.businessDate
    );

    index.unshift(status.businessDate);

    if(index.length > CONFIG.REDIS.MAX_BUSINESS_DAYS) {

        const removed = index.splice(15);

        for (const day of removed) {

            await redis.del(buildKey(day));

        }

    }

    await saveIndex(index);
    console.log("INDEX:", index);

    const verify = await redis.get(INDEX_KEY);

    console.log("VERIFY:", verify);
    return true;

}

export async function getStatus(businessDate) {

    const key = buildKey(businessDate);

    const raw = await redis.get(key);

    if (!raw)
        return null;

    return JSON.parse(raw);

}

export async function getLatestStatus() {

    const index = await loadIndex();

    if (index.length === 0)
        return null;

    return getStatus(index[0]);

}

export async function listBusinessDates() {

    return await loadIndex();

}

export async function deleteStatus(businessDate) {

    await redis.del(buildKey(businessDate));

    let index = await loadIndex();

    index = index.filter(
        d => d !== businessDate
    );

    await saveIndex(index);

    return true;

}

export async function clearStorage() {

    const dates = await loadIndex();

    for (const d of dates) {

        await redis.del(buildKey(d));

    }

    await redis.del(INDEX_KEY);

    return true;

}
