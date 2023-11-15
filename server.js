const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const users = require('./routes/users')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const salt = 10;
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['POST', 'GET'],
  credentials: true
}));

app.use('/api/users', users);
app.use(cors())
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password:'',
  database: 'restaurante'
})

// app.get("/checkdbconnection", (req, res) => {
//   db.connect((err) => {
//     if (err) {
//       res.status(500).json({ status: "Error", message: "No se pudo conectar a la base de datos" });
//     } else {
//       res.status(200).json({ status: "Éxito", message: "Conexión a la base de datos establecida" });
//     }
//   });
// });

app.get("/api", (req, res) => {
    res.json({ "users": ["userOne", "userTwo"] })
})

app.post("/api/login", (req, res)=> {
  const { email, password } = req.body
  const values = [email, password]
  var connection = db
  connection.query("SELECT * FROM usuario WHERE email = ?", values, (err, result) => {
    if(err){
      console.log(err);
      res.status(500).json(err)
    }else{
      if(result.length > 0){
        bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
          if(err) return res.json({Error: "Password compare error"});
          if(response) {
            const name = result[0].name;
            const token = jwt.sign({name}, "jwt-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            res.status(200).json({
              "authenticated": true,
              "id": result[0].idusuario,
              "nombre": result[0].nombre,
              "apellidos": result[0].apellidos,
              "correo": result[0].email         
            })
          } else {
            return res.json({Error: "Contraseña incorrecta"});
          }
        })
        
      }else{
        res.status(400).json({ authenticated: false, message: 'Usuario no existe' });
      }
    }
  })
})

app.post("/api/registro", (req, res) => {
  const sql = "INSERT INTO usuario (`nombre`,`apellidos`,`email`,`password`, `idrol`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) =>{
    if(err) return res.status(500).json({Error: "Error al encriptar la contrasena"});
    const values = [
      req.body.nombre,
      req.body.apellidos,
      req.body.email,
      hash,
      req.body.idrol
    ]
    db.query(sql, [values], (err, result) => {
      if(err) return res.status(500).json({ Error: "Error insertando información en el servidor", details: err });
      const name = req.body.name;
      const token = jwt.sign({name}, "jwt-secret-key", {expiresIn: '1d'});
      res.cookie('token', token);
      return res.json({Status: "Informacion insertada con exito"});
    })
  })
  
})
// app.get('/users', (req, res)=> {
//   const sql = "SELECT * FROM usuario";
//   db.query(sql, (err, data)=> {
//     if(err) return res.json(err);
//     return res.json(data);
//   })
// })

app.listen(5000, () => {
  console.log("Server started on port 5000")
})