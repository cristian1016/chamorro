const express = require('express');
let mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const app = express();
//le decimos a express que use el paquete cookie parser
//para trabajar con cookies
app.use(cookieParser());
//le decimos a express que configure las sesiones con
//llave secreta secret
//creamos el tiempo de expiracion en milisegundos
const timeEXp = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "rfghf66a76ythggi87au7td",
    saveUninitialized: true,
    cookie: { maxAge: timeEXp },
    resave: false
}));
//se habilita a express para analizar y leer //diferentes datos de la solicitud, por ejemplo formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');//se establece express para que maneje plantillas ejs
app.use('/public/', express.static('./public'));//en la carpeta public cargaremos los archivos
//estaticos
const port = 10101;
const pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'Sena1234',
    database: 'tiendadefaulth',
    debug: false
});
app.get('/', (req, res) => {
    //seleccionamos los campos de los productos de la tabla articulos
    pool.query("SELECT codigo, nombre, valor, url_imagen FROM articulos", (error, data) => {
        if (error) throw error;
        //si hay almenos un articulo...
        if (data.length > 0) {
    //recogemos la cookie de sesion
    let session = req.session;
    //verificamos si existe la sesion llamada correo y ademas que no haya expirado y también que
    //sea original, es decir, firmada por nuestro server
    if (session.correo) {
        //se retorna la plantilla llamada articulos al cliente con la info de todos los
        //articulos
        //y se mostrarán los nombres del usuario en el nav
        return res.render('index', { nombres: session.nombres, articulos: data })
    }
    //se retorna la plantilla llamada articulos al cliente con la info de todos los
    //articulos
    //y no se mostrarán los nombres del usuario en el nav ya no está logueado
    return res.render('index', { nombres: undefined, articulos: data })
}
//si no existen articulos en la base de datos...
return res.send('No hay artículos en este momento');
});
})

app.get('/interfaz-registro', (req, res) => {
    //se retorna la plantilla llamada registro que contiene
    //el formulario de registro
    return res.render('registro')
})
app.post('/registro', (req, res) => {
    //se obtienen los valores de los inputs del formulario
    //de registro
    let correo = req.body.correo;
    let nombres = req.body.nombres;
    let apellidos = req.body.apellidos;
    let contrasenia = req.body.contrasenia;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    //convertimos a hash el password del usuario
    const hash = bcrypt.hashSync(contrasenia, salt);
    pool.query("INSERT INTO usuario VALUES (?, ?, ?, ?)", [nombres, apellidos, hash, correo],
        (error) => {
            if (error) throw error;
            return res.redirect('/interfaz-login');
        });

        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
            user: 'defaulthmembersonly@gmail.com',
            pass: 'osvsxeebbngcnflw'
          }
        });
        
        
        
        // send email
        transporter.sendMail({
            from: 'defaulthmembersonly@gmail.com',
            to: correo,
            subject: 'Ensayo cliente correo',
            html:{path:'email.ejs'},
          
          }).then((res) => { console.log(res); }).catch((err) => { console.log(err); })
         
})
app.get('/interfaz-login', (req, res) => {
    //se retorna la plantilla llamada login que contiene
    //el formulario de login
    return res.render('login')
})
app.post('/login', (req, res) => {
    //se obtienen los valores de los inputs del formulario
    //de login
    let correo = req.body.correo;
    let contrasenia = req.body.contrasenia;
    pool.query("SELECT contraseña, nombres, apellidos FROM usuario WHERE correo=?", [correo],
        (error, data) => {
            if (error) throw error;
            //si existe un correo igual al correo que llega en el formulario de login...
            if (data.length > 0) {
                let contraseniaEncriptada = data[0].contraseña;
                //si la contraseña enviada por el usuario, al comparar su hash generado,
                //coincide con el hash guardado en la base de datos del usuario, hacemos login
                if (bcrypt.compareSync(contrasenia, contraseniaEncriptada)) {
                    //recogemos session de la solicitud del usuario
                    let session = req.session;
                    //iniciamos sesion al usuario
                    //en este caso la llamamos correo
                    //y ella contiene el email del usuario encriptado
                    session.correo = correo;
                    //también agregamos los nombres del Usuario a la sesión
                    session.nombres = `${data[0].nombres} ${data[0].apellidos}`
                    return res.redirect('/');
                }
                //si la contraseña enviada por el usuario es incorrecta...
                return res.send('Usuario o contraseña incorrecta');
            }
            //si no existe el usuario en la base de datos...
            return res.send('Usuario o contraseña incorrecta');
        });
})
app.get('/tienda', (req, res) => {
    //seleccionamos los campos de los productos de la tabla articulos
    pool.query("SELECT codigo, nombre, valor, url_imagen FROM articulos", (error, data) => {
        if (error) throw error;
        //si hay almenos un articulo...
        if (data.length > 0) {
            //recogemos la cookie de sesion
            let session = req.session;
            //verificamos si existe la sesion llamada correo y ademas que no haya expirado y
            //también que
            //sea original, es decir, firmada por nuestro server
            if (session.correo) {
                //se retorna la plantilla llamada articulos al cliente con la info de todos los
                //articulos
                //y se mostrarán los nombres del usuario en el nav
                return res.render('articulos', { nombres: session.nombres, articulos: data })
            }
            //se retorna la plantilla llamada articulos al cliente con la info de todos los
            //articulos
            //y no se mostrarán los nombres del usuario en el nav ya no está logueado
            return res.render('articulos', { nombres: undefined, articulos: data })
        }
        //si no existen articulos en la base de datos...
        return res.send('No hay artículos en este momento');
    });
})


app.get('/detalle-producto/:codigo', (req, res) => {
    //seleccionamos los campos del producto de la tabla articulos
    pool.query("SELECT codigo, nombre, valor, url_imagen, detalle FROM articulos WHERE codigo=?", [req.params.codigo], (error, data) => {
        if (error) throw error;
        console.log(data);
        if (data.length > 0) {
            //recogemos la cookie de sesion
            let session = req.session;
            //verificamos si existe la sesion llamada correo y ademas que //no haya expirado y también que
            //sea original, es decir, firmada por nuestro server
            if (session.correo) {
                //se retorna la plantilla llamada detalle al cliente con la info dettalada del
                //articulo
                //y se mostrarán los nombres del usuario en el nav
                return res.render('detalle', { nombres: session.nombres, articulo: data })
            }
            //se retorna la plantilla llamada detalle al cliente con la info dettalada del articulo
            //y no se mostrarán los nombres del usuario en el nav ya no está logueado
            return res.render('detalle', { nombres: undefined, articulo: data })
        }
        //si no existe el usuario en la base de datos...
        return res.send('A ocurrido un error al cargar el artículo, inténtelo mas tarde');
    });
})
app.post('/comprar/:codigo', (req, res) => {
    //recogemos la cookie de sesion
    let session = req.session;
    //verificamos si existe la sesion llamada correo y ademas que no haya expirado y también
    //que
    //sea original, es decir, firmada por nuestro server
    if (session.correo) {
        //aca obtenemos el código del artículo que pasamos por la ruta como parámetro
        let codigo = req.params.codigo;
        //insertamos el codigo del articulo comprado y el correo del usuario que lo compró
        pool.query("INSERT INTO compras VALUES (?, ?)", [session.correo, codigo], (error) => {
            if (error) throw error;
            //se retorna la plantilla llamada compraok al cliente notificando que la compra ha sido
            //exitosa
            return res.render('compraok', { nombres: session.nombres })
        });
    } else {
        //si el usuario no está logueado, le enviamos un mensaje para que inicie sesión
        return res.send('Por favor inicie sesión para realizar su compra')
    }
})
app.get('/logout', (req, res) => {
    //recogemos la cookie de sesion
    let session = req.session;
    //verificamos si existe la sesion llamada correo y ademas que no haya expirado y también que
    //sea original, es decir, firmada por nuestro server
    //si la sesión está iniciada la destruimos
    if (session.correo) {
        //la destruimos
        req.session.destroy();
        //redirigimos al usuario a la ruta raíz
        return res.redirect('/');
    } else
        return res.send('Por favor inicie sesión')
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

