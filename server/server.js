const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://dayronttorres_db_user:Arkhe123@cluster0.mfwtti4.mongodb.net/arkhe?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error:", err.message));

// --- MODELOS ---
const Question = mongoose.model('Question', new mongoose.Schema({
    topic: String, question: String, correct: String, wrongs: [String]
}));

const User = mongoose.model('User', new mongoose.Schema({
    user: { type: String, unique: true },
    pass: String,
    role: { type: String, default: 'USER' }
}));

// --- RUTAS PREGUNTAS ---
app.get('/api/questions', async (req, res) => {
    const questions = await Question.find();
    res.json(questions);
});

app.post('/api/questions', async (req, res) => {
    const newQ = new Question(req.body);
    await newQ.save();

    res.json(newQ);
});

app.delete('/api/questions/:id', async (req, res) => {
    await Question.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Borrado" });
});

// --- RUTAS USUARIOS (REGISTRO Y LOGIN) ---
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (err) {
        res.status(400).json({ error: "El usuario ya existe" });
    }
});

app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    const found = await User.findOne({ user, pass });
    if (found) res.json(found);
    else res.status(401).json({ error: "Credenciales inválidas" });
});


// Busca donde dice const PORT = 4000 y cámbialo por esto:
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));