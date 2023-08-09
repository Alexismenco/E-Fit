const jwt = require('../utils/jwt');
require('dotenv').config();

const permisosUser = async function(req,res,next){
   
    if(!req.headers.cookie){
        return res.redirect('/inicio');
    }
    
    var userVerify = jwt.verificarToken(req.headers.cookie);
    userVerify.then((valor) => {
        if (valor === null) {
            res.cookie(process.env.JWT_COOKIE,"",{httpOnly:true,maxAge:1});
            return res.redirect('/inicio');
        }
      });

    next();
}

const prevenirLogin = async function(req,res,next){
   
        if(req.headers.cookie!=undefined){
            res.redirect("/")
        }
    
    next();
}

module.exports={prevenirLogin,permisosUser}