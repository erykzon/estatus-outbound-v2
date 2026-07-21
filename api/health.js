export default function handler(req, res) {

    res.status(200).json({

        status: "OK",

        project: "Estatus Outbound V2",

        version: "1.0",

        serverTime: new Date().toISOString()

    });

}
