const { conexion } = require('../db');
const fs = require('fs');
const path = require('path');

const buscarSuplementos = async function () {
    var buscarPlanes='SELECT * FROM "Suplementos" ORDER BY "precio" ASC;'
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

const buscarSuplemento = async function (id) {
    var buscarPlan='SELECT * FROM "Suplementos" WHERE "id"=$1;'
    var parametros=[id]
    var respuestaPlan;
    try{
        respuestaPlan = await conexion.query(buscarPlan, parametros);
        var imagenes = await buscarImagenesEnCarpeta(respuestaPlan.rows[0].id);
        respuestaPlan.rows[0].fotos = imagenes;
        
       return respuestaPlan.rows[0];
    } catch(err){
        console.log("Error al buscar suplemento: "+err.message);
        return null;
    }
}

const buscarImagenesEnCarpeta = async (id) => {
    const archivos = fs.readdirSync('./public/suplementos/');
  
    var img = [];

    for (const archivo of archivos) {
        const nombreCompleto = path.join('./public/suplementos/', archivo);

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

module.exports={buscarSuplementos, buscarSuplemento}