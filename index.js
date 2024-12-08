//Importamos las librarías requeridas
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

//Documentación en https://expressjs.com/en/starter/hello-world.html
const app = express()
app.use(cors());

//Creamos un parser de tipo application/json
//Documentación en https://expressjs.com/en/resources/middleware/body-parser.html
const jsonParser = bodyParser.json()

// Abre la base de datos de SQLite
let db = new sqlite3.Database('./base.sqlite3', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');

    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        todo TEXT NOT NULL,
        created_at INTEGER
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Tabla tareas creada o ya existente.');
        }
    });
});

//Creamos un endpoint de login que recibe los datos como json
app.post('/insert', jsonParser, function (req, res) {
    //Imprimimos el contenido del campo todo
    const { todo } = req.body;
   
    console.log(todo);
    res.setHeader('Content-Type', 'application/json');
    

    if (!todo) {
        res.status(400).send('Falta información necesaria');
        return;
    }
    const stmt  =  db.prepare('INSERT INTO todos (todo, created_at) VALUES (?, CURRENT_TIMESTAMP)');

    stmt.run(todo, (err) => {
        if (err) {
          console.error("Error running stmt:", err);
          res.status(500).send(err);
          return;

        } else {
          console.log("Insert was successful!");
        }
    });

    stmt.finalize();
    
    //Enviamos de regreso la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.status(201).send();
})

app.get('/', function (req, res) {
    //Enviamos de regreso la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok2' }));
})

//Creamos un endpoint de login que recibe los datos como json
app.post('/login', jsonParser, function (req, res) {
    //Imprimimos el contenido del body
    console.log(req.body);

    //Enviamos de regreso la respuesta
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok' }));
})

//Creamos un endpoint para listar todas las tareas pendientes
app.get('/listar_tareas', (req, res) => {
    const query = 'SELECT * FROM todos'; // Selecciona columnas específicas

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al recuperar las tareas:', err);
            return res.status(500).json({ error: 'Error al recuperar las tareas.' });
        }

        if (rows.length === 0) {
            console.log('No hay tareas disponibles.');
            return res.status(200).json([]); // Devuelve un array vacío si no hay datos
        }

        // Devuelve las tareas en formato JSON
        console.log('Tareas recuperadas:', rows);
        res.status(200).json(rows);
    });
});

app.post('/agrega_todo', jsonParser, function (req, res) {
    const { todo } = req.body; // Extraer el campo "todo" del cuerpo de la solicitud

    // Validar que se haya enviado el campo "todo"
    if (!todo) {
        res.status(400).json({ error: 'El campo "todo" es obligatorio.' });
        return;
    }
    
    // Preparar la consulta INSERT en SQLite
    const query = `INSERT INTO todos (todo, created_at) VALUES (?, strftime('%s', 'now'))`;
    db.run(query, [todo], function (err) {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            res.status(500).json({ error: 'Error al insertar en la base de datos.' });
            return;
        }

        // Responder con un estado HTTP 201 y el ID del nuevo registro
        res.status(201).json({
            message: 'Todo agregado exitosamente.',
            id: this.lastID, // ID del registro recién insertado
        });
    });
});

//Corremos el servidor en el puerto 3001
const port = 3001;

app.listen(port, () => {
    console.log(`Aplicación corriendo en http://localhost:${port}`)
})
