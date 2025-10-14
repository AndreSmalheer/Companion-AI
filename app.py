from flask import Flask, request, jsonify, render_template, Response
import requests
import json
import sqlite3
from datetime import datetime

OLLAMA_API_URL = "http://100.98.84.102:11434/api/generate"
MODEL = "gemma3:4b"

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

def fetch_chat_history():
    conn = sqlite3.connect("history.db")
    conn.row_factory = sqlite3.Row  # rows act like dicts
    c = conn.cursor()
    c.execute("SELECT id, sender, message, timestamp FROM messages ORDER BY id ASC")
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

@app.route("/get_chat_history")
def get_chat_history():
    rows = fetch_chat_history()  # call the helper
    return jsonify(rows)

def stream_ollama(prompt):
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": True
    }

    full_response = ""

    with requests.post(OLLAMA_API_URL, json=payload, stream=True) as r:
        for line in r.iter_lines():
            if line:
                data = json.loads(line.decode("utf-8"))
                if "response" in data:
                    full_response += data['response']
                    yield f"{data['response']}"
                     
        timestamp = datetime.now().isoformat()
        save_message(full_response, "bot", timestamp)          

def save_message(message, sender, timestamp):
    conn = sqlite3.connect('history.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO messages (sender, message, timestamp) VALUES (?, ?, ?)', (sender, message, timestamp))
    conn.commit()
    conn.close()

def generate_llm_context():
    history = fetch_chat_history()

    context = ""
    for msg in history:
        context += f"{msg['sender']}: {msg['message']}\n"

    return context.strip()

@app.route("/ollama", methods=["POST"])
def ollama():
    data = request.get_json()
    user_input = data.get("text")

    history = fetch_chat_history()
    save_message(user_input, "user", datetime.now())    
    
    context = ""
    for msg in history:
        context += f"{msg['sender']}: {msg['message']}\n"
    
    return Response(stream_ollama(context + user_input), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run()
