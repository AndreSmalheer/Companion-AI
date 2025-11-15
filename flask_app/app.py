from flask import Flask, render_template, request
import requests

app = Flask(__name__)

ELECTRON_URL = "http://localhost:8123"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/show_overlay")
def show_overlay():
    try:
        requests.get(f"{ELECTRON_URL}/show")
    except:
        pass
    return "OK"

@app.route("/hide_overlay")
def hide_overlay():
    try:
        requests.get(f"{ELECTRON_URL}/hide")
    except:
        pass
    return "OK"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
