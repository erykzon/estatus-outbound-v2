const API = "/api";

export async function getLatestStatus(){

    const response = await fetch(`${API}/status`);

    if(!response.ok)
        throw new Error("Error obteniendo datos.");

    return await response.json();

}

export async function getStatusByDate(date){

    const response = await fetch(`${API}/status?date=${date}`);

    if(!response.ok)
        throw new Error("Fecha no encontrada.");

    return await response.json();

}
