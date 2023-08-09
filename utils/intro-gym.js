const { conexion } = require('../db');

const intro = async function () {
    // Ver si tiene planes nutricionales
    var buscarVideos = 'SELECT * FROM "intro-gym"';
    var respuestaVideos;
    try{
        respuestaVideos = await conexion.query(buscarVideos);
    } catch(err){
        console.log("Error al buscar video de intro: "+err.message);
        respuestaVideos = null;
    }

    return respuestaVideos.rows;
}

module.exports={intro}