export default function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message: "Method Not Allowed"

        });

    }

    const body = req.body;

    return res.status(200).json({

        success: true,

        received: body,

        message: "Datos recibidos correctamente"

    });

}
