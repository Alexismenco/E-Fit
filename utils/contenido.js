const { conexion } = require('../db');
require('dotenv').config();
const verPlanes = async function (email) {
    // Ver si tiene planes nutricionales
    var buscarPlanes = 'SELECT * FROM "Pedidos" WHERE "email"=$1 AND "estado"=$2;';
    var parametros = [email, 'activo'];
    var respuestaPlanes;
    try{
        respuestaPlanes = await conexion.query(buscarPlanes, parametros);
    } catch(err){
        console.log("Error al buscar planes en pedido: "+err.message);
        respuestaPlanes = null;
    }

    return respuestaPlanes.rows;
}

module.exports={verPlanes}