from flask import Flask, request, jsonify, render_template, session, redirect, url_for, flash
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from nutri import NutritionistAgent
import mysql.connector
import os, uuid, logging

# ---------------- CONFIGURAÇÃO BÁSICA ----------------
app = Flask(__name__)
CORS(app)
app.secret_key = "uma_chave_secreta_forte_aqui"
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache de agentes por session_id e user_id
agent_cache = {}

def get_agent(session_id: str, user_id: int = None, email: str = None):
    global agent_cache
    if not session_id:
        session_id = 'anon'
    key = f"{user_id}_{session_id}"
    if key in agent_cache:
        return agent_cache[key]
    logger.info(f"Criando novo NutritionistAgent para user_id={user_id}, session_id={session_id}")
    mysql_config = None
    agent = NutritionistAgent(session_id=session_id, mysql_config=mysql_config, user_id=user_id, email=email)
    agent_cache[key] = agent
    return agent

# ---------------- CONEXÃO COM MYSQL ----------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database=os.getenv('MYSQL_DATABASE', 'nutrinow')
    )

# Pasta para uploads
UPLOAD_FOLDER = r"C:\Users\Júlio César\Pictures\Uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- ROTAS DE AUTENTICAÇÃO ----------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        nome = request.form.get("first_name")
        sobrenome = request.form.get("last_name")
        data_nascimento = request.form.get("birth_date")
        genero = request.form.get("gender")
        email = request.form.get("email")
        senha = request.form.get("password")

        if not all([nome, sobrenome, data_nascimento, genero, email, senha]):
            flash("Preencha todos os campos!", "error")
            return redirect(url_for("register"))

        hashed_password = generate_password_hash(senha)

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM usuarios WHERE email=%s", (email,))
            if cursor.fetchone():
                flash("E-mail já cadastrado!", "error")
                return redirect(url_for("register"))

            cursor.execute("""
                INSERT INTO usuarios (nome, sobrenome, data_nascimento, genero, email, senha)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (nome, sobrenome, data_nascimento, genero, email, hashed_password))

            conn.commit()
            flash("Cadastro realizado! Faça login.", "success")
            return redirect(url_for("login"))
        finally:
            cursor.close()
            conn.close()
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        senha = request.form.get("password")

        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM usuarios WHERE email=%s", (email,))
            user = cursor.fetchone()

            if not user or not check_password_hash(user["senha"], senha):
                flash("E-mail ou senha inválidos!", "error")
                return redirect(url_for("login"))

            # Seta a sessão corretamente
            session["user_id"] = user["id"]
            session["user_name"] = user["nome"]
            session["user_email"] = user["email"]
            logger.info(f"Login OK: {session['user_name']} ({session['user_email']})")

            return redirect(url_for("chat_page"))

        finally:
            cursor.close()
            conn.close()

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

# ---------------- ROTAS DO CHAT ----------------
@app.route("/chat_page")
def chat_page():
    logger.info(f"Session atual: {session}")
    if "user_id" not in session:
        return redirect(url_for("login"))
    return render_template('chat.html')

@app.route("/chat_history", methods=["GET"])
def chat_history():
    session_id = request.args.get("session_id")
    user_id = request.args.get("user_id")
    if not session_id:
        return jsonify({"success": False, "error": "session_id não informado"}), 400

    try:
        agent = get_agent(session_id=session_id, user_id=user_id)
        history = agent.get_conversation_history(by_user=True)
        return jsonify({"success": True, "history": history})
    except Exception as e:
        logger.exception("Erro ao buscar histórico")
        return jsonify({"success": False, "error": "Erro ao buscar histórico"}), 500

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200
    try:
        session_id = request.headers.get('X-Session-ID') or request.form.get('session_id')
        user_id = session.get("user_id")
        email = session.get("user_email")
        if not session_id:
            session_id = str(uuid.uuid4())

        message = request.form.get('message')
        if not message and request.is_json:
            data = request.get_json()
            message = data.get('message')

        if not message:
            return jsonify({"error": "Nenhuma mensagem enviada"}), 400

        logger.info(f"[{session_id}] Mensagem recebida: {message}")

        agent = get_agent(session_id=session_id, user_id=user_id, email=email)
        response = agent.run_text(message)

        logger.info(f"[{session_id}] Resposta gerada")

        return jsonify({"success": True, "session_id": session_id, "response": response})

    except Exception as e:
        logger.exception("Erro no endpoint /chat")
        return jsonify({"success": False, "error": "Erro interno no servidor"}), 500

@app.route("/analyze_image", methods=["POST", "OPTIONS"])
def analyze_image():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200
    try:
        session_id = request.headers.get('X-Session-ID') or request.form.get('session_id')
        user_id = session.get("user_id")
        email = session.get("user_email")
        if not session_id:
            session_id = str(uuid.uuid4())

        if 'file' not in request.files:
            return jsonify({"error": "Nenhum arquivo enviado"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Nenhum arquivo selecionado"}), 400

        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}{file_ext}")
        file.save(file_path)

        agent = get_agent(session_id=session_id, user_id=user_id, email=email)
        analysis_result = agent.run_image(file_path)

        return jsonify({"success": True, "session_id": session_id, "response": analysis_result})

    except Exception as e:
        logger.exception("Erro no endpoint /analyze_image")
        return jsonify({"success": False, "error": "Erro na análise"}), 500

    finally:
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            logger.exception("Erro ao remover arquivo temporário")

# ---------------- ROTA HOME ----------------
@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("login"))

# ---------------- INÍCIO DO APP ----------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv('PORT', 8000)), debug=True)
