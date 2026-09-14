
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

print("API key loaded:", api_key is not None)

client = OpenAI(api_key=api_key)

from health_data import health_data


app = Flask(__name__)

@app.route("/ai-test", methods=["GET"])
def ai_test():

    response = client.responses.create(
        model="gpt-5.6-luna",
        input="Say hello to my Health Assistant in one short sentence."
    )

    return jsonify({
        "reply": response.output_text
    })

CORS(app)


# =========================
# Database configuration
# =========================

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT configuration
app.config["JWT_SECRET_KEY"] = "health-chatbot-secret-key-change-later"

db = SQLAlchemy(app)
jwt = JWTManager(app)


# =========================
# User database model
# =========================

class User(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )


# =========================
# Message database model
# =========================

class Message(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sender = db.Column(
        db.String(20)
    )

    text = db.Column(
        db.String(500)
    )


# =========================
# Home
# =========================

@app.route("/")
def home():

    return "Health chatbot backend is running"


# =========================
# Register
# =========================

@app.route("/register", methods=["POST"])
def register():

    data = request.json

    username = data.get("username")
    password = data.get("password")

    if not username or not password:

        return jsonify({
            "error": "Username and password are required"
        }), 400

    # Check if username already exists

    existing_user = User.query.filter_by(
        username=username
    ).first()

    if existing_user:

        return jsonify({
            "error": "Username already exists"
        }), 409

    # Hash the password

    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully"
    }), 201


# =========================
# Login
# =========================

@app.route("/login", methods=["POST"])
def login():

    data = request.json

    username = data.get("username")
    password = data.get("password")

    if not username or not password:

        return jsonify({
            "error": "Username and password are required"
        }), 400

    # Find user

    user = User.query.filter_by(
        username=username
    ).first()

    if not user:

        return jsonify({
            "error": "Invalid username or password"
        }), 401

    # Check password

    if not check_password_hash(
        user.password,
        password
    ):

        return jsonify({
            "error": "Invalid username or password"
        }), 401

    # Create login token

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "username": user.username
    })


# =========================
# Profile
# =========================

@app.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:

        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "id": user.id,
        "username": user.username
    })


# =========================
# Chat
# =========================

@app.route("/chat", methods=["POST"])
@jwt_required()
def chat():

    data = request.json
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({
            "error": "Message is required"
        }), 400

    # Save user's message
    user_chat = Message(
        sender="user",
        text=user_message
    )

    db.session.add(user_chat)
    db.session.commit()

    # Default response
    reply = None

    # ==========================================
    # Try AI first
    # ==========================================

    try:

        response = client.responses.create(
            model="gpt-5.6-luna",
            input=f"""
You are a helpful Health Assistant.

User question:
{user_message}

Give a simple and clear health-related answer.
Do not make a definite medical diagnosis.
If the user may need professional medical attention, recommend seeing a doctor.
"""
        )

        reply = response.output_text

    except Exception as e:

        print("AI unavailable:", e)

    # ==========================================
    # Fallback to health_data.py
    # ==========================================

    if not reply:

        reply = "Sorry, I don't have information about that yet."

        for symptom, answer in health_data.items():

            if symptom.lower() in user_message.lower():

                reply = answer
                break

    # Save bot response
    bot_chat = Message(
        sender="bot",
        text=reply
    )

    db.session.add(bot_chat)
    db.session.commit()

    return jsonify({
        "reply": reply
    })

    data = request.json

    user_message = data["message"]

    # Save user's message

    user_chat = Message(
        sender="user",
        text=user_message
    )

    db.session.add(user_chat)
    db.session.commit()

    # Find health-related answer

    reply = "Sorry, I don't have information about that yet."

    for symptom, answer in health_data.items():

        if symptom in user_message.lower():

            reply = answer
            break

    # Save bot's response

    bot_chat = Message(
        sender="bot",
        text=reply
    )

    db.session.add(bot_chat)
    db.session.commit()

    return jsonify({
        "reply": reply
    })


# =========================
# Get saved chat history
# =========================

@app.route("/history", methods=["GET"])
@jwt_required()
def history():

    messages = Message.query.order_by(
        Message.id.asc()
    ).all()

    return jsonify([
        {
            "sender": message.sender,
            "text": message.text
        }

        for message in messages
    ])


# =========================
# Create database tables
# =========================

with app.app_context():

    db.create_all()


# =========================
# Run server
# =========================

if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
