from flask import Flask, jsonify, request
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import os

load_dotenv() 

app = Flask(__name__)

SECRET_KEY = os.getenv('SECRET_KEY').encode()
cipher = Fernet(SECRET_KEY)

db_config = {
    "host": os.getenv('DB_HOST'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASSWORD'),
    "database": os.getenv('DB_NAME')
}

# Establish connection
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Create users table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username_encrypted TEXT NOT NULL,
        password_hash VARCHAR(255) NOT NULL
    )
""")
conn.commit()

# Encrypt Username
def encrypt_username(username):
    return cipher.encrypt(username.encode()).decode()

# Decrypt Username
def decrypt_username(encrypted_username):
    return cipher.decrypt(encrypted_username.encode()).decode()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"status": "failure", "message": "Username and password required"}), 400

    try:
        encrypted_username = encrypt_username(username)  # Encrypt the username
        password_hash = generate_password_hash(password)  # Hash the password

        cursor.execute(
            "INSERT INTO users (username_encrypted, password_hash) VALUES (%s, %s)",
            (encrypted_username, password_hash),
        )
        conn.commit()
        return jsonify({"status": "success", "message": "User registered successfully"}), 201

    except mysql.connector.IntegrityError:
        return jsonify({"status": "failure", "message": "Username already exists"}), 409

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    cursor.execute("SELECT username_encrypted, password_hash FROM users")
    users = cursor.fetchall()

    for encrypted_username, password_hash in users:
        decrypted_username = decrypt_username(encrypted_username)

        if decrypted_username == username and check_password_hash(password_hash, password):
            return jsonify({"status": "success", "message": "Login successful"}), 200

    return jsonify({"status": "failure", "message": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(port=5000, debug=True)
