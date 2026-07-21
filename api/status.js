export default function handler(req, res) {

    res.status(200).json({

        success: true,

        history: 0,

        rows: [],

        lastUpdate: null

    });

}
