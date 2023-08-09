const { conexion } = require('../db');

const verDeportes = async function (id) {

    var buscarPlan='SELECT * FROM "Servicios" WHERE "id"=$1;'
    var parametros=[id]
    var respuestaPlan;
    try{
        respuestaPlan = await conexion.query(buscarPlan, parametros);
    } catch(err){
        console.log("Error al buscar plan: "+err.message);
        return null;
    }

    if (respuestaPlan.rows.length > 0 & id != 1002) {
        const videos = respuestaPlan.rows[0].Video.split(",");
        const titulos = respuestaPlan.rows[0].Titulo.split(",");

        const resultado = [];

        for (let i = 0; i < videos.length; i++) {
          resultado.push({
            video: videos[i],
            titulo: titulos[i],
          });
        }
        return resultado;
      } else if(respuestaPlan.rows.length > 0 & id == 1002) {
        const videos = respuestaPlan.rows[0].Video.split(",");
        const titulos = respuestaPlan.rows[0].Titulo.split(",");
        const comentario = respuestaPlan.rows[0].Comentario.split("_");

        const resultado = [];

        for (let i = 0; i < videos.length; i++) {
          resultado.push({
            video: videos[i],
            titulo: titulos[i],
            descripcion: comentario[i]
          });
        }
        return resultado;
        return null;
      }else {
        // La respuesta de la base de datos está vacía
        return null;
      }
}

module.exports={verDeportes}