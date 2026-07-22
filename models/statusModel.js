export function createStatusModel(payload) {

    return {

        version: payload.version,

        businessDate: payload.businessDate,

        generatedAt: payload.generatedAt,

        generatedBy: payload.generatedBy,

        summary: payload.summary,

        rows: payload.rows

    };

}
