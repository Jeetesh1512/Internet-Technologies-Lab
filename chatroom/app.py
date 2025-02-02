from flask import Flask, jsonify, request
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

db_config = {
    "host": "localhost",
    "user": "root",  
    "password": "abj1512@h", 
    "database": "user_auth"
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
    )
""")
conn.commit()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"status": "failure", "message": "Username and password required"}), 400

    try:
        password_hash = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, password_hash))
        conn.commit()
        return jsonify({"status": "success", "message": "User registered successfully"}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"status": "failure", "message": "Username already exists"}), 409

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    cursor.execute("SELECT password_hash FROM users WHERE username = %s", (username,))
    result = cursor.fetchone()

    if result and check_password_hash(result[0], password):
        return jsonify({"status": "success", "message": "Login successful"}), 200
    return jsonify({"status": "failure", "message": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(port=5000)
