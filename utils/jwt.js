const jwt = require('jsonwebtoken');
require('dotenv').config();

// generar token con clave secreta .env
const generarToken = async function (usuario) {
    const token = await jwt.sign({
        email:usuario.email,
        nombre:usuario.nombre,
        foto: usuario.foto
    },
    process.env.JWT_SECRET,
    {
        expiresIn:"1000d"
    })
    return token;
}

// revisar si el token es valido
const verificarToken = async function (token) {
    try{
        return jwt.verify(token.substring(5),process.env.JWT_SECRET);
    } catch (error){
        return null;
    }
}

// Retorna el email
const obtenerDataCookie = async function (token) {
    try{
        var data = jwt.verify(token.substring(5),process.env.JWT_SECRET);
        return data
    } catch (error){
        return null
    }
}

module.exports={generarToken,verificarToken, obtenerDataCookie}