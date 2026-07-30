/**
 * ============================================================
 * Utilities
 * Estatus Outbound V2
 * ============================================================
 */

export function formatNumber(value){
    return Number(value || 0).toLocaleString("es-MX");
}

export function formatDate(date){
    if(!date) return "--";
    const d = new Date(date);
    if(isNaN(d)) return "--";
    return d.toLocaleDateString("es-MX");
}

export function formatDateTime(date){
    if(!date) return "--";
    const d = new Date(date);
    if(isNaN(d)) return "--";
    return d.toLocaleString("es-MX",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
}

export function toISO(date){
    if(!date) return "";
    const d = new Date(date);
    if(isNaN(d)) return "";
    return d.toISOString().split("T")[0];
}

/**
 * Parsea "Hora Unidades", que puede venir como:
 *  - ISO datetime completo
 *  - "HH:MM:SS"
 *  - texto libre como "EN ESPERA" (no es una hora valida)
 * Devuelve un objeto Date valido o null si no se puede interpretar.
 */
export function parseArrivalTime(value, referenceDate){
    if(!value) return null;

    // Si ya es un datetime ISO completo
    const asDate = new Date(value);
    if(!isNaN(asDate) && String(value).includes("T")){
        return asDate;
    }

    // Si es formato HH:MM:SS o HH:MM
    const match = String(value).match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
    if(match && referenceDate){
        const base = new Date(referenceDate);
        base.setHours(parseInt(match[1]), parseInt(match[2]), parseInt(match[4]||0), 0);
        return base;
    }

    // Texto libre no interpretable (ej "EN ESPERA")
    return null;
}

/**
 * Calcula horas restantes (positivo) o transcurridas desde vencido (negativo)
 * entre ahora y una fecha limite.
 */
export function hoursUntil(targetDate){
    if(!targetDate) return null;
    const target = new Date(targetDate);
    if(isNaN(target)) return null;
    const now = new Date();
    return (target - now) / (1000 * 60 * 60);
}

/**
 * Determina la fase de riesgo segun horas restantes.
 * Umbrales: >=3h verde, 2-3h amarillo, 1-2h naranja, 0-1h rojo, <=0 vencido
 */
export function riskPhase(hoursRemaining){
    if(hoursRemaining === null) return null;
    if(hoursRemaining <= 0) return "expired";
    if(hoursRemaining <= 1) return "red";
    if(hoursRemaining <= 2) return "orange";
    if(hoursRemaining <= 3) return "amber";
    if(hoursRemaining <= 4) return "green";
    return null; // fuera de ventana de riesgo (>4h)
}

const PHASE_COLORS = {
    green:  {color:"var(--teal)",   fillPct: null}, // calculado dinamicamente
    amber:  {color:"var(--amber)",  fillPct: null},
    orange: {color:"var(--orange)", fillPct: null},
    red:    {color:"var(--red)",    fillPct: null},
    expired:{color:"var(--red)",    fillPct: 100}
};

export function phaseColor(phase){
    return PHASE_COLORS[phase] ? PHASE_COLORS[phase].color : "var(--border)";
}

/**
 * Calcula el % de llenado del acento lateral dentro de su fase actual.
 * Cada fase dura 1 hora (excepto green que dura de 4h a 3h).
 * 100% = recien entro a la fase, 0% = a punto de pasar a la siguiente.
 */
export function phaseFillPercent(hoursRemaining, phase){
    if(phase === "expired") return 100;

    const bounds = {
        green:  [4, 3],
        amber:  [3, 2],
        orange: [2, 1],
        red:    [1, 0]
    };

    if(!bounds[phase]) return 0;

    const [hi, lo] = bounds[phase];
    const pct = ((hoursRemaining - lo) / (hi - lo)) * 100;
    return Math.max(0, Math.min(100, pct));
}

export function normalizeText(value){
    return String(value || "").trim();
}

export function normalizeUpper(value){
    return normalizeText(value).toUpperCase();
}
