const { conexion } = require('../db');
const fs = require('fs');
const path = require('path');

const buscarProductos = async function () {
    var buscarPlanes='SELECT * FROM "Productos" ORDER BY "precio" ASC;'
    var respuestaPlanes;
    try{
        respuestaPlanes = await conexion.query(buscarPlanes);

        var imagenes;
        for(i=0; i<respuestaPlanes.rows.length; i++){
            imagenes = await buscarImagenesEnCarpeta(respuestaPlanes.rows[i].id);
            respuestaPlanes.rows[i].fotos = imagenes;
        }
        
       return respuestaPlanes.rows;
    } catch(err){
        console.log("Error al buscar planes: "+err.message);
        return null;
    }
}

const buscarProducto = async function (id) {
    var buscarPlan='SELECT * FROM "Productos" WHERE "id"=$1;'
    var parametros=[id]
    var respuestaPlan;
    try{
        respuestaPlan = await conexion.query(buscarPlan, parametros);
        var imagenes = await buscarImagenesEnCarpeta(respuestaPlan.rows[0].id);
        respuestaPlan.rows[0].fotos = imagenes;
        
       return respuestaPlan.rows[0];
    } catch(err){
        console.log("Error al buscar plan: "+err.message);
        return null;
    }
}

const buscarImagenesEnCarpeta = async (id) => {
    const archivos = fs.readdirSync('./public/productos/');
  
    var img = [];

    for (const archivo of archivos) {
        const nombreCompleto = path.join('./public/productos/', archivo);

        // Separar el nombre y la extensión del archivo
        const { name, ext } = path.parse(nombreCompleto);

        // Comparar el nombre sin la extensión con el id
        if (name == (id+'-')) {
            img.push(archivo);
        }else if(name.slice(0, id.length) == id){
            img.push(archivo);
        }
    }
    return img;
}

module.exports={buscarProductos, buscarProducto}