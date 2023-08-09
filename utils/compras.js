const { conexion } = require('../db');
require('dotenv').config();

const guardaCompra = async function (dataBuy, dataPlan) {
    // Buscar id
    var buscarId = 'SELECT id FROM "Pedidos" ORDER BY "id" DESC LIMIT 1;';
    var respuestaPlanes;
    var id = 1;
    try{
        respuestaPlanes = await conexion.query(buscarId);
    } catch(err){
        console.log("Error al buscar id pedido: "+err.message);
    }

    try{ 
        id = (respuestaPlanes.rows[0].id + 1);
    }catch(err){
        console.log("Error al colocar id pedido: "+err.message);
    }

    // Guardar Compra
    var fecha = new Date()
    fecha.setHours(fecha.getHours() - 4);
    var estado = dataPlan.id <= 999?'unico':'activo'; 
    var guardarCompra = 'INSERT INTO "Pedidos"(id, cantidad, estado, fecha, "Monto", idservicio, email, buy_order, session_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);'
    var parametros = [id, 1, estado, fecha.toUTCString(), dataBuy.amount, dataPlan.id, dataBuy.email, dataBuy.buy_order, dataBuy.session_id, ];
    try{
        respuestaPlanes = await conexion.query(guardarCompra, parametros);
    } catch(err){
        console.log("Error al guardar pedido: "+err.message);
    }
}


const comprobarPlan = async function (compra) {

    var fecha1 = new Date(compra.fecha);  // Fecha proporcionada
    var fechaActual = new Date();  // Fecha actual

    // Convertir las fechas a milisegundos
    var fecha1Milisegundos = fecha1.getTime();
    var fechaActualMilisegundos = fechaActual.getTime();

    // Calcular la diferencia en milisegundos
    var diferenciaEnMilisegundos = fechaActualMilisegundos - fecha1Milisegundos;

    // Convertir la diferencia en días
    var diferenciaEnDias = diferenciaEnMilisegundos / (1000 * 60 * 60 * 24);

    if(diferenciaEnDias > 42.0) cambiarEstado(compra.id);

    return diferenciaEnDias;

}

const cambiarEstado = async function (id) {

    var cambiaEstado = 'UPDATE "Pedidos" SET estado=$1 WHERE "id"=$2;'
    var parametros = ['inactivo', id];
    var respuestaEstado;
    try{
        respuestaEstado = await conexion.query(cambiaEstado, parametros);
    } catch(err){
        console.log("Error al guardar pedido: "+err.message);
    }
      
}

module.exports={guardaCompra, comprobarPlan}