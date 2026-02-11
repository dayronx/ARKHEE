import './style.css';

const app = document.getElementById('app');
const API_URL = "http://127.0.0.1:4000/api";

function checkAuth() {
    const session = JSON.parse(sessionStorage.getItem("arkhe_session"));
    if (!session) renderLogin();
    else renderMain(session);
}

// --- VISTA: LOGIN ---
function renderLogin() {
    app.innerHTML = `
        <div class="container">
            <div class="card" style="max-width:350px; margin: 80px auto; padding: 20px;">
                <h2>Iniciar Sesión</h2>
                <input type="text" id="user" placeholder="Usuario">
                <input type="password" id="pass" placeholder="Contraseña">
                <button class="btn btn-green" style="width:100%" id="login-btn">Entrar</button>
                <div style="margin-top:20px; text-align:center;">
                    <button class="link-btn" id="btn-forgot">¿Olvidaste tu contraseña?</button>
                    <p>¿No tienes cuenta? <button class="link-btn" style="color:#2ecc71" id="btn-go-reg">Regístrate</button></p>
                </div>
            </div>
        </div>`;

    document.getElementById('login-btn').onclick = async () => {
        const user = document.getElementById('user').value;
        const pass = document.getElementById('pass').value;
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            if (res.ok) {
                const session = await res.json();
                sessionStorage.setItem("arkhe_session", JSON.stringify(session));
                checkAuth();
            } else {
                alert("Usuario o contraseña incorrectos");
            }
        } catch (err) {
            alert("Error de conexión con el servidor");
        }
    };

    document.getElementById('btn-go-reg').onclick = renderRegister;
    document.getElementById('btn-forgot').onclick = () => alert("📧 Enlace de recuperación enviado.");
}

// --- VISTA: REGISTRO (CORREGIDA) ---
function renderRegister() {
    console.log("Renderizando vista de registro...");
    app.innerHTML = `
        <div class="container">
            <div class="card" style="max-width:350px; margin: 80px auto; padding: 20px;">
                <h2>Crear Cuenta</h2>
                <input type="text" id="reg-user" placeholder="Nuevo Usuario">
                <input type="password" id="reg-pass" placeholder="Contraseña">
                <button class="btn btn-green" style="width:100%" id="reg-confirm-btn">Crear Cuenta Ahora</button>
                <button class="link-btn" style="display:block; margin:10px auto;" id="btn-back">Volver</button>
            </div>
        </div>`;

    // Usar addEventListener es más seguro en entornos como Vite
    document.getElementById('reg-confirm-btn').addEventListener('click', async () => {
        const user = document.getElementById('reg-user').value;
        const pass = document.getElementById('reg-pass').value;

        if (!user || !pass) return alert("Por favor rellena todos los campos");

        console.log("Enviando registro para:", user);

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass, role: "USER" })
            });

            if (res.ok) {
                alert("✅ Cuenta creada con éxito. Ahora inicia sesión.");
                renderLogin(); // Volver al login sin recargar toda la página
            } else {
                const data = await res.json();
                alert("❌ Error: " + (data.error || "El usuario ya existe"));
            }
        } catch (err) {
            console.error("Error en fetch:", err);
            alert("❌ No se pudo conectar con el servidor. ¿Está encendido?");
        }
    });

    document.getElementById('btn-back').onclick = renderLogin;
}

// --- VISTA: PRINCIPAL ---
function renderMain(session) {
    app.innerHTML = `
        <header class="navbar" style="display:flex; justify-content:space-between; padding:15px; background:#f4f4f4; align-items:center;">
            <div class="logo" style="font-weight:bold; cursor:pointer" id="logo-home">Arkhe.</div>
            <div>
                ${session.role === 'ADMIN' ? '<button class="btn" id="btn-admin">Crear</button>' : ''}
                <button class="btn btn-green" id="btn-play">Temas</button>
                <button id="btn-logout" style="color:red; background:none; border:none; cursor:pointer">Salir</button>
            </div>
        </header>
        <main class="container" id="view-container"></main>`;

    document.getElementById('logo-home').onclick = () => location.reload();
    document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); checkAuth(); };
    if (session.role === 'ADMIN') document.getElementById('btn-admin').onclick = renderAdmin;
    document.getElementById('btn-play').onclick = renderTopicSelection;
    renderTopicSelection();
}

// --- RESTO DE FUNCIONES (ADMIN Y JUEGO) ---
async function renderAdmin() {
    const view = document.getElementById('view-container');
    view.innerHTML = `
        <h1>Panel Admin</h1>
        <div class="card">
            <form id="arkhe-form">
                <input type="text" id="q-topic" placeholder="Área (HISTORIA, JS...)" required>
                <input type="text" id="q-text" placeholder="Pregunta" required>
                <input type="text" id="q-correct" placeholder="Respuesta Correcta" required>
                <div id="wrong-container"><input type="text" class="wrong-input" placeholder="Opción Falsa" required></div>
                <button type="button" class="btn" id="add-opt-btn">+ Opción</button>
                <button type="submit" class="btn btn-green" style="width:100%; margin-top:10px">Guardar</button>
            </form>
        </div>
        <div id="table-box" style="margin-top:20px"></div>`;

    document.getElementById('add-opt-btn').onclick = window.addWrongField;

    document.getElementById('arkhe-form').onsubmit = async (e) => {
        e.preventDefault();
        const newQ = {
            topic: document.getElementById('q-topic').value.toUpperCase(),
            question: document.getElementById('q-text').value,
            correct: document.getElementById('q-correct').value,
            wrongs: Array.from(document.querySelectorAll('.wrong-input')).map(i => i.value)
        };
        await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQ)
        });
        renderAdmin();
    };
    renderTable();
}

async function renderTable() {
    const res = await fetch(`${API_URL}/questions`);
    const data = await res.json();
    document.getElementById('table-box').innerHTML = `
        <table style="width:100%">
            ${data.map(q => `<tr><td>${q.topic}</td><td>${q.question}</td><td><button onclick="deleteEntry('${q._id}')">🗑️</button></td></tr>`).join('')}
        </table>`;
}

async function renderTopicSelection() {
    const res = await fetch(`${API_URL}/questions`);
    const db = await res.json();
    const topics = [...new Set(db.map(q => q.topic))];
    const view = document.getElementById('view-container');
    
    if (topics.length === 0) { view.innerHTML = "<h3>No hay preguntas cargadas.</h3>"; return; }

    view.innerHTML = `<h1>Selecciona un Área</h1><div id="topics-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"></div>`;
    topics.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'btn'; btn.innerText = t;
        btn.onclick = () => startQuiz(t);
        document.getElementById('topics-grid').appendChild(btn);
    });
}

async function startQuiz(topic) {
    const res = await fetch(`${API_URL}/questions`);
    const all = await res.json();
    const filtered = all.filter(q => q.topic === topic);
    let idx = 0;

    const show = () => {
        if (idx >= filtered.length) {
            document.getElementById('view-container').innerHTML = `<h2>Fin del Quizz</h2><button class="btn btn-green" id="btn-reload">Volver</button>`;
            document.getElementById('btn-reload').onclick = () => location.reload();
            return;
        }
        const q = filtered[idx];
        const opts = [q.correct, ...q.wrongs].sort(() => Math.random() - 0.5);
        document.getElementById('view-container').innerHTML = `
            <h3>${q.topic}</h3>
            <div class="card">
                <p>${q.question}</p>
                <div id="options-container"></div>
            </div>`;
        
        opts.forEach(o => {
            const b = document.createElement('button');
            b.className = 'btn opt-btn';
            b.style.display = 'block'; b.style.width = '100%'; b.style.margin = '5px 0';
            b.innerText = o;
            b.onclick = () => {
                if (o === q.correct) alert("✅ Correcto");
                else alert(`❌ Incorrecto. Era: ${q.correct}`);
                idx++; show();
            };
            document.getElementById('options-container').appendChild(b);
        });
    };
    show();
}

// --- GLOBALES ---
window.addWrongField = () => {
    const container = document.getElementById('wrong-container');
    if(container) {
        const i = document.createElement('input'); 
        i.className = 'wrong-input'; i.placeholder = 'Opción Falsa'; i.required = true;
        container.appendChild(i);
    }
};

window.deleteEntry = async (id) => {
    await fetch(`${API_URL}/questions/${id}`, { method: 'DELETE' });
    renderAdmin();
};

checkAuth();