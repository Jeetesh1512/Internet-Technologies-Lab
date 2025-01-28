from flask import Flask, jsonify, request

app = Flask(__name__)

users = {"user1": "password1", "user2": "password2", "user3":"password3","user4":"password4"}

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if users.get(username) == password:
        return jsonify({"status": "success", "message": "Login successful"}), 200
    return jsonify({"status": "failure", "message": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(port=5000)  
