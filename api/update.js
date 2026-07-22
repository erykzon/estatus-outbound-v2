import { saveStatus } from "../lib/storage.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Método no permitido."
        });

    }

    try {

        const result = await saveStatus(req.body);

        return res.status(200).json({

            success: true,

            message: "Información almacenada correctamente.",

            businessDate: result.businessDate

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

}
