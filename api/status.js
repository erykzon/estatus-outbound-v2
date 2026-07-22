import {
    getLatestStatus,
    getStatus
} from "../lib/storage.js";

export default async function handler(req, res) {

    try {

        const { date } = req.query;

        let data;

        if (date) {

            data = await getStatus(date);

        } else {

            data = await getLatestStatus();

        }

        if (!data) {

            return res.status(404).json({

                success: false,

                message: "No existe información."

            });

        }

        return res.status(200).json(data);

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

}
