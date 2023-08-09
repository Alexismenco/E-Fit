const { conexion } = require('../db');
require('dotenv').config();

const buscarPlanes = async function (nombre) {
    var buscarPlanes='SELECT * FROM "Servicios" WHERE "Nombre"=$1 ORDER BY "Precio" ASC;'
    var parametros=[nombre];
    var respuestaPlanes;
    try{
        respuestaPlanes = await conexion.query(buscarPlanes, parametros);
       return respuestaPlanes.rows;
    } catch(err){
        console.log("Error al buscar planes: "+err.message);
        return null;
    }
}

const buscarPlan = async function (id) {
    var buscarPlan='SELECT * FROM "Servicios" WHERE "id"=$1;'
    if(id <= 999){
        buscarPlan = 'SELECT * FROM "Productos" WHERE "id"=$1;'
    }
    var parametros=[id]
    var respuestaPlan;
    try{
        respuestaPlan = await conexion.query(buscarPlan, parametros);
       return respuestaPlan.rows[0];
    } catch(err){
        console.log("Error al buscar plan: "+err.message);
        return null;
    }
}

module.exports={buscarPlanes, buscarPlan}