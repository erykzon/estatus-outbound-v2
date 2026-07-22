/*
====================================================
Estatus Outbound
API Test
====================================================
*/

const API_BASE = window.location.origin;

const output = document.getElementById("output");

const businessDate = document.getElementById("businessDate");

//-------------------------------------------
// Mostrar respuesta bonita
//-------------------------------------------

function showResult(data){

    output.textContent = JSON.stringify(data,null,4);

}

//-------------------------------------------
// Mostrar error
//-------------------------------------------

function showError(error){

    output.textContent = error;

}

//-------------------------------------------
// Obtener fecha seleccionada
//-------------------------------------------

function getSelectedDate(){

    return businessDate.value;

}

//-------------------------------------------
// Health
//-------------------------------------------

async function healthCheck(){

    try{

        const response = await fetch(
            `${API_BASE}/api/health`
        );

        const data = await response.json();

        showResult(data);

    }

    catch(ex){

        showError(ex.message);

    }

}

//-------------------------------------------
// Guardar datos de prueba
//-------------------------------------------

async function saveTestData(){

    try{

        const date =
            getSelectedDate() ||
            new Date().toISOString().substring(0,10);

        const payload={

            version:"2.0",

            businessDate:date,

            generatedBy:"API TEST",

            rows:[

                {

                    date,

                    warehouse:"Macro HA 3",

                    customer:"Liverpool",

                    cn:"260200001",

                    pieces:120,

                    orderStatus:"Pendiente",

                    unitStatus:"En Patio",

                    appointment:"08:00",

                    maxDeparture:"09:00",

                    cut:"A",

                    tiros:1,

                    cat:"SI",

                    laser:true,

                    armado:false,

                    insumos:true

                },

                {

                    date,

                    warehouse:"Macro HA 4",

                    customer:"Costco",

                    cn:"260200002",

                    pieces:340,

                    orderStatus:"Liberado",

                    unitStatus:"En Carga",

                    appointment:"10:00",

                    maxDeparture:"11:00",

                    cut:"B",

                    tiros:2,

                    cat:"NO",

                    laser:false,

                    armado:true,

                    insumos:false

                }

            ]

        };

        const response = await fetch(

            `${API_BASE}/api/update`,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify(payload)

            }

        );

        const data = await response.json();

        showResult(data);

    }

    catch(ex){

        showError(ex.message);

    }

}

//-------------------------------------------
// Obtener último
//-------------------------------------------

async function getLatest(){

    try{

        const response = await fetch(

            `${API_BASE}/api/status`

        );

        const data = await response.json();

        showResult(data);

    }

    catch(ex){

        showError(ex.message);

    }

}

//-------------------------------------------
// Buscar fecha
//-------------------------------------------

async function getByDate(){

    try{

        const date=getSelectedDate();

        if(!date){

            alert("Selecciona una fecha.");

            return;

        }

        const response=await fetch(

            `${API_BASE}/api/status?date=${date}`

        );

        const data=await response.json();

        showResult(data);

    }

    catch(ex){

        showError(ex.message);

    }

}
