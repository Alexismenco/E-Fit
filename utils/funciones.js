const { conexion } = require('../db');
const jwt = require('./jwt');
require('dotenv').config();

const actualizarFoto = async function (foto,email) {
    var insertarFoto='UPDATE "Usuarios" SET "Foto_perfil"=$1 WHERE "Email"=$2;'
    const parametros14=[foto,email];
    var respuestaFoto;
    try{
       respuestaFoto = await conexion.query(insertarFoto,parametros14);
    } catch(err){
        console.log("Error añadir foto perfil: "+err.message);
    }
}

const actualizarNombre = async function (nombre,email) {
    var actualizaNombre='UPDATE "Usuarios" SET "Nombre"=$1 WHERE "Email"=$2'
    var parametros=[nombre, email]
    var respuestaNombre;
    try{
        respuestaNombre = await conexion.query(actualizaNombre,parametros);
    } catch(err){
        console.log("Error cambiar nombre: "+err.message);
    }
}

const actualizarEmail = async function (emailNuevo,email) {
    var actualizaEmail='UPDATE "Usuarios" SET "Email"=$1 WHERE "Email"=$2';
    var parametros=[emailNuevo, email];
    var respuestaEmail;
    try{
      respuestaEmail = await conexion.query(actualizaEmail,parametros);
    } catch(err){
        console.log("Error cambiar email: "+err.message);
    }
}

const actualizarPassword = async function (passwordNueva,email, passwordAntigua) {
   // Cambiar contraseña
   var actualizaPassword='UPDATE "Usuarios" SET "Password"=$1 WHERE "Email"=$2 AND "Password"=$3'
   var parametros=[passwordNueva, email, passwordAntigua]
   var respuestaPassword;
   try{
     respuestaPassword = await conexion.query(actualizaPassword,parametros);
   } catch(err){
       console.log("Error cambiar password: "+err.message);
   }
}


const actualizarDireccion = async function (direccion, comuna, region, recibe, email) {
  // Cambiar direccion
  var agregarDireccion = 'UPDATE "Usuarios" SET "Direccion"=$1, "Comuna"=$2, "Region"=$3, "Recibe"=$4 WHERE "Email"=$5;'
  var parametros=[direccion, comuna, region, recibe,email]
  var respuestaPassword;
  try{
    respuestaPassword = await conexion.query(agregarDireccion,parametros);
  } catch(err){
      console.log("Error actualizar direccion: "+err.message);
  }
}

const tieneDireccion = async function (email) {
  // Cambiar direccion
  var buscarDireccion = 'SELECT * FROM "Usuarios" WHERE "Email"=$1;'
  var parametros=[email]
  var respuestaDireccion;
  try{
    respuestaDireccion = await conexion.query(buscarDireccion,parametros);
  } catch(err){
      console.log("Error si tiene password: "+err.message);
  }
  return respuestaDireccion.rows[0];
}

const buscarDatosUsuario = async function (email){
    // Buscar datos usuario
    var consultaUsuario='SELECT "Nombre" ,"Email", "Foto_perfil" from "Usuarios" WHERE "Email"=$1';
    const parametros2=[email];
    var respuestaUsuario;

  try{
    respuestaUsuario = await conexion.query(consultaUsuario,parametros2);
    // Si existe genera la cookie
    if(respuestaUsuario.rows[0]!==undefined){
      const usuario = {
        email:respuestaUsuario.rows[0].Email,
        nombre:respuestaUsuario.rows[0].Nombre,
        foto: respuestaUsuario.rows[0].Foto_perfil
      }
      const token = await jwt.generarToken(usuario);
      return token;
    }
  } catch(err){
      console.log("Error generar cookie: "+err.message);
  }
}

module.exports={actualizarNombre, actualizarEmail, buscarDatosUsuario, actualizarFoto, actualizarPassword, actualizarDireccion, tieneDireccion}