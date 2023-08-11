const express=require('express');
const app=new express();
require('dotenv').config();
const {conexion} = require('./db');
const jwt = require('./utils/jwt');
const funciones = require('./utils/funciones');
const introVideos = require('./utils/intro-gym');
const planes = require('./utils/planes');
const products = require('./utils/productos');
const suplementos = require('./utils/suplementos');
const compras = require('./utils/compras');
const contenido = require('./utils/contenido');
const verDeportes = require('./utils/ver');
const { prevenirLogin, permisosUser } = require('./middleware/autenticacion');
const nodemailer=require('nodemailer');
const upload = require('express-fileupload');

const fs = require('fs');
const path = require('path');

const WebpayPlus = require('transbank-sdk').WebpayPlus;
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require("transbank-sdk");

// configuracion nodmeailer
var transporter=nodemailer.createTransport({
  service:'gmail',
  auth:{
    user:process.env.MAILUSER,
    pass:process.env.MAILPASS
  }
});

// configuracion server
app.use(express.urlencoded({extended:false}))
app.use(express.static('public'));
app.use(upload());
app.set('view engine',"ejs");
app.set("views",__dirname+"/views");

// Usuario nuevo inicio
app.get('/inicio', (req,res) => {
  res.render('inicio');
})

// Inicio
app.get('/',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var verPlanes = await contenido.verPlanes(data.email);
  var planes = verPlanes.length>0?verPlanes:null;
  res.render('index',{nombre:data.nombre, fotoPerfil:data.foto, planes})
});

// Ajustes
app.get('/ajustes',permisosUser, async (req,res) => { // ajustes lleva a: /perfil  /seguridad
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  res.render('ajustes',{nombre:data.nombre, fotoPerfil:data.foto})
});

// Seguridad
app.get('/seguridad',permisosUser, async (req,res) => { 
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  res.render('seguridad',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto})

});

// Editar perfil
app.get('/perfil',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  res.render('perfil',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto})
})

// Editar direccion
app.get('/direccion',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var direccion = await funciones.tieneDireccion(data.email);
  res.render('direccion',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto, direccion: direccion})
})

// Guarda direccion 
app.post('/direccion',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var guardarDireccion = await funciones.actualizarDireccion(req.body.direccion, req.body.comuna, req.body.region, req.body.nombre, data.email);
 res.redirect('direccion');
});

// Editar perfil
app.post('/perfil',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});

  if(req.body.nombre){ // Cambiar nombre

    await funciones.actualizarNombre(req.body.nombre, data.email);

  }else if(req.body.email){ // Cambiar email

    await funciones.actualizarEmail(req.body.email, data.email);
    data.email=req.body.email;

  }else if(req.files){ // Cambiar foto de perfil

   var perfil=req.files.foto;
   await funciones.actualizarFoto(perfil.name, data.email);

   perfil.mv(`./public/perfil/${perfil.name}`,err => { // Guarda la foto en el server
    if(err) return res.status(500).send({ message : err })     
  })

  }else if(req.body.passworda){

    await funciones.actualizarPassword(req.body.passwordn, data.email, req.body.passworda);
  }

  res.cookie(process.env.JWT_COOKIE,"",{httpOnly:true,maxAge:1});
  const token = await funciones.buscarDatosUsuario(data.email);
  res.cookie(process.env.JWT_COOKIE,token,{httpOnly:true});

  var ruta = req.headers.referer=='http://localhost:3000/seguridad'?'/seguridad':'/perfil';

  res.redirect(ruta);
});

// Mis planes comprados
app.get('/planes',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  // Ver mis planes
  var verPlanes = await contenido.verPlanes(data.email);
  var planes = verPlanes.length>0?verPlanes:null;
  var verificar;
  for(i=0; i<planes.length; i++){
    verificar = await compras.comprobarPlan(planes[i]);
    planes[i].dias = verificar
    if(planes[i].idservicio==1001){
      planes[i].foto='1-.png';
      planes[i].name='Plan HIIT';

    } else if (planes[i].idservicio==1002){
      planes[i].foto='2-.jpeg';
      planes[i].name='Plan Masa Muscular Hombre';
    }else if(planes[i].idservicio==1003){
      planes[i].foto='3-.jpg';
      planes[i].name='Plan Abdominales';
    }else if(planes[i].idservicio==1004){
      planes[i].foto='4-.jpg';
      planes[i].name='Plan Masa Muscular Mujer';
    }
  }

  res.render('planes',{nombre:data.nombre, fotoPerfil:data.foto, planes})
});

// Ver contenido de planes
app.post('/contenido', permisosUser, async (req, res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie);
  var introGym = await introVideos.intro();
  var verPlanes = await contenido.verPlanes(data.email);
  var planes = verPlanes.length > 0 ? verPlanes : null;

  var titulos = await verDeportes.verDeportes(req.body.id);

  var carpeta = 'plan-1/';
  if(req.body.id == 1001){
    carpeta = 'plan-3/';
  }else if(req.body.id == 1003){
    carpeta = 'plan-2/';
  }

  // Ruta de la carpeta de videos
  const videosFolder = path.join(__dirname, 'public', 'videos', carpeta.slice(0, -1));

  // Leer el contenido de la carpeta
  fs.readdir(videosFolder, (err, files) => {
    if (err) {
      console.error('Error al leer la carpeta de videos:', err);
      res.sendStatus(500);
    } else {
      // Filtrar los archivos de video
      const videos = files.filter(file => {
        const extension = path.extname(file).toLowerCase();
        return ['.mp4', '.avi', '.mkv'].includes(extension);
      });

      
    // Ordenar los videos por nombre
    videos.sort((a, b) => {
      return parseInt(a) - parseInt(b);
    });

      // 19 1002 masa muscular hombre
      // 19 1004 masa muscular mujer
      // 9v 1003 abdominales
      // 7v 1001 hiit
      var id = req.body.id;

      // Pasa la lista de videos al renderizado
      res.render('contenido', { nombre: data.nombre, fotoPerfil: data.foto, planes, videos, titulos, introGym, carpeta, id});
    }
  });
});


// Planes de deportes
app.get('/deportes',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var planesDeportes = await planes.buscarPlanes('planes de deportes');
  var plan = req.query.plan || null;
  if(plan!==null) res.redirect('pago?plan='+ req.query.plan);
  
  res.render('deportes',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto, planesDeportes});
});

// Planes de nutrición
app.get('/nutricion',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var planesDeportes = await planes.buscarPlanes('planes de nutricion');
  var plan = req.query.plan || null;
  if(plan!==null) res.redirect('pago?plan='+ req.query.plan);

  res.render('nutricion',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto, planesDeportes})
});

// Suplementos
app.get('/suplementos',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var productos = await suplementos.buscarSuplementos();
  var plan = req.query.plan || null;
  if(plan!==null) res.redirect('pago?plan='+ req.query.plan);

  res.render('suplementos',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto, productos})
});

// Maquinas
app.get('/maquinas',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var productos = await products.buscarProductos();

  console.log(productos)
  var plan = req.query.plan || null;
  if(plan!==null) res.redirect('buy?plan='+ req.query.plan);

  res.render('maquinas',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto, productos})
});

// Pago Plan
app.get('/pago',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var planDeportes = await planes.buscarPlan(req.query.plan);
  // Formulario de envio si es una maquina o suplemento
 var Direccion= await funciones.tieneDireccion(data.email)

if(Direccion.Comuna==null && req.query.plan>=3000){
  res.render('envio',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes});
}
  // Configuracion webpay
  IntegrationCommerceCodes.WEBPAY_PLUS = process.env.TBKAPIKEYID;
  IntegrationApiKeys.WEBPAY = process.env.TBKAPIKEYSECRET;

  let buyOrder = "O-" + Math.floor(Math.random() * 10000) + 1;
  let sessionId = "S-" + Math.floor(Math.random() * 10000) + 1;

  const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Production));
  const response = await tx.create(buyOrder, sessionId, planDeportes.Precio, process.env.DIRECCIONRETORNO+'?product='+planDeportes.id);
  
  const token = response.token;
  const url = response.url;

  res.render('pago',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes, token, url})
});

// Guarda direccion 
app.post('/pago',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var guardarDireccion = await funciones.actualizarDireccion(req.body.direccion, req.body.comuna, req.body.region, req.body.nombre, data.email);
 res.redirect('pago?plan=' + req.query.plan)
});

// Pago productos (Maquinas y accesorios)
app.get('/buy',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});

  var planDeportes;
  var rutaAnterior = req.headers.referer;
  
  if (rutaAnterior && rutaAnterior.includes('suplementos')) {
    planDeportes = await suplementos.buscarSuplemento(req.query.plan);
    planDeportes.sup = true;
  } else if (req.query.sup=='si') {
    planDeportes = await suplementos.buscarSuplemento(req.query.plan);
    planDeportes.sup = true;
  }else {
    planDeportes = await products.buscarProducto(req.query.plan);
    planDeportes.sup = false;
  }
  // Formulario de envio si es una maquina o suplemento
 var Direccion= await funciones.tieneDireccion(data.email)

if(Direccion.Comuna==null){
  res.render('envio',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes});
}

  res.render('pagoMaquina',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes})
});

// Confirmar pedido maquinas
app.post('/confirm',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  var planDeportes;
  if (req.body.sup=='no') {
    planDeportes = await products.buscarProducto(parseInt(req.body.id));
    planDeportes.sup=false;
  } else {
    planDeportes = await suplementos.buscarSuplemento(parseInt(req.body.id));
    planDeportes.sup=true;
  }
  planDeportes.precio = req.body.monto
  // Formulario de envio si es una maquina o suplemento
 var Direccion= await funciones.tieneDireccion(data.email);

if(Direccion.Comuna==null){
  res.render('envio',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes});
}
  // Configuracion webpay
  IntegrationCommerceCodes.WEBPAY_PLUS = process.env.TBKAPIKEYID;
  IntegrationApiKeys.WEBPAY = process.env.TBKAPIKEYSECRET;

  let buyOrder = "O-" + Math.floor(Math.random() * 10000) + 1;
  let sessionId = "S-" + Math.floor(Math.random() * 10000) + 1;

  const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Production));
  const response = await tx.create(buyOrder, sessionId, parseInt(req.body.monto), process.env.DIRECCIONRETORNO+'?product='+req.body.id);
  
  const token = response.token;
  const url = response.url;

  res.render('confirm',{nombre: data.nombre,email: data.email, fotoPerfil:data.foto, planDeportes, token, url, Direccion})
});


// Regreso de la orden en transbank 
app.get("/dev",async function(req,res){
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});

  let params = req.method === 'GET' ? req.query : req.body;
  let token = req.query.token_ws;
  let tbkToken = params.TBK_TOKEN;
  let step;
  let compra=false;

  if (token && !tbkToken) {//Flujo 1
    const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Production));
    const commitResponse = await tx.commit(token);
    if(commitResponse.status=='AUTHORIZED'){
      commitResponse.email = data.email;
      var dataPlan = await planes.buscarPlan(params.product);
      await compras.guardaCompra(commitResponse, dataPlan);
      step = "Transacción exitosa.";
      compra=true;
    } 
    }else if (!token && !tbkToken) {//Flujo 2
      step = "El pago fue anulado por tiempo de espera.";
    }else if (!token && tbkToken) {//Flujo 3
      step = "El pago fue anulado por el usuario.";
    }else{//Flujo 4
      step = "El pago es inválido.";
    }

  res.render('compra',{nombre: data.nombre, email: data.email, fotoPerfil: data.foto,step,compra});
});


//--------------------------------Register----------------------------------------------------------
app.get('/register',prevenirLogin, (req,res) => {
  var existe=false;
  var codigoExiste=true;
  res.render('register',{existe,codigoExiste:codigoExiste})
});

app.post("/register", async function (req,res){
  // Consulta si el email esta registrado
  var consultaUser='SELECT "Email" from "Usuarios" WHERE "Email"=$1'
  const parametros=[req.body.email];
  var respuestaUser;
  var existe=false;
  try{
    respuestaUser = await conexion.query(consultaUser,parametros);
  } catch(err){
      console.log("Error consulta: "+err.message);
  }

  try{
    if(respuestaUser.rows[0].Email==req.body.email){
      existe= true;
      var user=req.headers.cookie || false ;
      var codigoExiste=true;

      res.render('register',{user:user, existe:existe, codigoExiste:codigoExiste});
    }
  }catch(err){
    console.log("Error consulta: "+err.message);
  }  

  // Codigo valido
  var consultaCodigo='SELECT "codigo" FROM "codigo" WHERE "codigo"=$1;'
  var parametros7 = [req.body.codigo];
  var codigoExiste= false;
  var respuestaCodigo;

  try{
    respuestaCodigo = await conexion.query(consultaCodigo,parametros7);
  } catch(err){
      console.log("Error consulta: "+err.message);
  }

  try{
    if(respuestaCodigo.rows[0].codigo==req.body.codigo){
      codigoExiste= true;

      // Borrar codigo
      var borrarCodigo='DELETE FROM "codigo" WHERE "codigo"=$1;'
      const parametros8=[req.body.codigo];
      var respuestaBorrar;
      try{
        respuestaBorrar = await conexion.query(borrarCodigo,parametros8);
      } catch(err){
          console.log("Error consulta: "+err.message);
      }
    }
  }catch(err){
    console.log("Error consulta: "+err.message);
    codigoExiste=false;

    res.render('register',{user:user, existe:existe, codigoExiste:codigoExiste})
  }  

  // Agrega Usuario
    var registrar='INSERT INTO "Usuarios"("Nombre", "Email", "Password", "Tipo") VALUES ($1, $2, $3, 2);';
    const parametros2=[req.body.name,req.body.email,req.body.password[0]];
    var respuestaRegistro;
    try{
      respuestaRegistro = await conexion.query(registrar,parametros2);
    } catch(err){
        console.log("Error consulta: "+err.message);
        var user=req.headers.cookie || false ;
        var existe=false;

        res.render('register',{user:user, existe})
    }

    // Añadir codigo a usuario
    var agregarCodigo='UPDATE "Usuarios" SET "Codigo"=$1 WHERE "Email"=$2;'
    const parametros9=[req.body.codigo,req.body.email];
    var resultadoAgregar;
    try{
      resultadoAgregar = await conexion.query(agregarCodigo,parametros9);
    } catch(err){
        console.log("Error consulta: "+err.message);
    }

    var rolAdmin=req.headers.cookie || false ;
    var nouser=true;
  // msg si viene de restauracion contraseña
    var msg=false;
    var existeUsuario= true;

    res.render('login',{rolAdmin:rolAdmin, nouser:nouser, msg:msg, existeUsuario:existeUsuario})
  });

  // Restaurar contraseña
app.get('/resetpassword', async (req,res) => {
  var mensaje = false;
  res.render('restorePass',{mensaje:mensaje});
});

app.post('/resetpassword', async (req,res) => {
  // Genera codigo de restauracion
  var codigo='';
  while(codigo.length<=5){
    codigo+= Math.floor((Math.random() * 10))
  }
  codigo = parseInt(codigo);

  // Almacenar en la db codigo
  var ingresarCodigo='UPDATE "Usuarios" SET "Restore"=$1 WHERE "Email"=$2;';
    const parametros3=[codigo,req.body.email];
    var respuestaCodigo;
    try{
      respuestaCodigo = await conexion.query(ingresarCodigo,parametros3);
    } catch(err){
        console.log("Error consulta: "+err.message);
    }

  // Envia correo al user
  let mensajeCorreo = "Restaurar contraseña\n";
  mensajeCorreo+="codigo:"+codigo+"\n";
  let mail={
    from: req.body.email,
    to: req.body.email,
    subject:'Restaurar contraseña',
    text:mensajeCorreo
  }
  transporter.sendMail(mail,function(err,info){
    if(err){
      console.log("Error en correo: "+err.message);
      res.status(500).send("Error al enviar correo");
    }else{
      console.log("Correo restaurar contraseña enviado: "+ info.response);
    }
  });

  var correo=req.body.email
  var mensaje=false;

  res.render('restoreCode',{correo:correo, mensaje:mensaje})
});

// Restaurar contraseña
app.get('/restoreCode', async (req,res) => {
  var mensaje=false;
  res.render('restoreCode',{mensaje:mensaje})
});

app.post('/restoreCode', async (req,res) => {
  var consultaPass='SELECT "Email","Restore" from "Usuarios" WHERE "Email"=$1 AND "Restore"=$2'
  const parametrosPass=[req.body.email,req.body.codigo];
  var respuestaPass;

  try{
    respuestaPass = await conexion.query(consultaPass,parametrosPass);
  } catch(err){
      console.log("Error consulta: "+err.message);
  }

  if(respuestaPass.rows[0]==undefined){
    var rolAdmin=req.headers.cookie || false ;
    var mensaje=true;
    var correo= 'none';

    res.render('restoreCode',{rolAdmin:rolAdmin, mensaje:mensaje, correo:correo})
  }else{
    var correo=req.body.email;
    res.render('passwordNew',{correo:correo})
  }
});

app.post('/passwordNew', async (req,res) => {
  var actualizarPass='UPDATE "Usuarios" SET "Password"=$1 WHERE "Email"=$2;';
    const parametros5=[req.body.password,req.body.email];
    var respuestaActualizacion;
    try{
      respuestaActualizacion = await conexion.query(actualizarPass,parametros5);

    } catch(err){
        console.log("Error consulta: "+err.message);
    }
    var rolAdmin=req.headers.cookie || false ;
    var nouser=true;
    var msg=true;
    var existeUsuario= true;

    res.render('login',{rolAdmin:rolAdmin, nouser:nouser, msg:msg, existeUsuario:existeUsuario})
});
//--------------------------------Register End----------------------------------------------------------

// Login
app.get("/login",prevenirLogin , async function (req,res){
    var existeUsuario=true;
 
    res.render('login',{existeUsuario})
});

app.post("/login", async function (req,res){
  // Usuario registrado en la db
  var consultaUsuario='SELECT "Nombre" ,"Email","Password", "Foto_perfil" from "Usuarios" WHERE "Email"=$1 AND "Password"=$2'
  const parametros=[req.body.email,req.body.password];
  var respuestaUsuario;
  var existeUsuario=true;

  try{
    respuestaUsuario = await conexion.query(consultaUsuario,parametros);
  } catch(err){
      console.log("Error login: "+err.message);
  }
  // Si existe genera la cookie
  if(respuestaUsuario.rows[0]!==undefined){

    var foto = respuestaUsuario.rows[0].Foto_perfil || 'perfil.webp';

    const usuario = {
      email:respuestaUsuario.rows[0].Email,
      nombre:respuestaUsuario.rows[0].Nombre,
      foto: foto
    }
    const token = await jwt.generarToken(usuario);
    
    res.cookie(process.env.JWT_COOKIE,token,{httpOnly:true});
    res.redirect('/');
  }else{
    existeUsuario=false;
    res.render('login', {existeUsuario});
  }
});

// Contactar
app.get('/ayuda',permisosUser, async (req,res) => {
  var data = await jwt.obtenerDataCookie(req.headers.cookie).then( data => {return data});
  res.render('ayuda',{nombre: data.nombre, email: data.email ,fotoPerfil: data.foto});
});

  // Se envia correo
app.post("/enviarcontacto",permisosUser,function(req,res){
  let mensaje = "Mensaje desde formulario de contacto\n";
  mensaje+="de :"+req.body.nombre+"\n";
  mensaje+="correo: "+req.body.correo+"\n";
  mensaje+="mensaje: "+req.body.comentario;
  let mail={
    from: req.body.correo,
    to: 'e.fit.super@gmail.com',
    subject:'mensaje formulario contacto',
    text:mensaje
  }
  transporter.sendMail(mail,function(err,info){
    if(err){
      console.log("Error en correo: "+err.message);
      res.status(500).send("Error al enviar correo");
    }else{
      console.log("Correo enviado: "+ info.response);
      res.redirect("/ayuda");
    }
  })
});

// Politicas y privacidad
app.get('/politica-privacidad', (req,res) => {
  res.render('politica-privacidad');
});

// Politicas de cookie
app.get('/politica-de-cookie', (req,res) => {
  res.render('politica-de-cookie');
});

// Aviso legal
app.get('/aviso-legal', (req,res) => {
  res.render('aviso-legal');
});

// Cerrar sesión
app.post("/logout", function (req,res){
  res.cookie(process.env.JWT_COOKIE,"",{httpOnly:true,maxAge:1});
  res.redirect("/login");
});

module.exports={app}