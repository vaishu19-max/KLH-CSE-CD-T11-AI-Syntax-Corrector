from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from collections import Counter
from pathlib import Path

from lexer import tokenize

app = Flask(__name__)
CORS(app)

FRONTEND_FOLDER = Path(__file__).resolve().parent.parent / "frontend"


# Home page
@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


# Serve CSS and JavaScript files
@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)


# Lexical analysis API
@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json(silent=True) or {}
    source_code = data.get("code", "")

    if not isinstance(source_code, str):
        return jsonify({"error": "Code must be a string"}), 400

    tokens, errors = tokenize(source_code)

    token_counts = dict(Counter(
        token["token"] for token in tokens
    ))

    statistics = {
        "total_tokens": len(tokens),
        "total_errors": len(errors),
        "token_counts": token_counts
    }

    return jsonify({
        "tokens": tokens,
        "errors": errors,
        "statistics": statistics
    })


# NFA and DFA API
@app.route("/automata", methods=["GET"])
def automata():

    nfa = {
        "nodes": [
            {"id": "N0", "label": "Start"},
            {"id": "N1", "label": "Identifier"},
            {"id": "N2", "label": "Number"},
            {"id": "N3", "label": "Accept ID"},
            {"id": "N4", "label": "Accept Number"}
        ],
        "edges": [
            {"from": "N0", "to": "N1", "label": "Letter / _"},
            {"from": "N0", "to": "N2", "label": "Digit"},
            {"from": "N1", "to": "N1", "label": "Letter / Digit / _"},
            {"from": "N1", "to": "N3", "label": "End"},
            {"from": "N2", "to": "N2", "label": "Digit"},
            {"from": "N2", "to": "N4", "label": "End"}
        ],
        "start": "N0",
        "accepting": ["N3", "N4"]
    }

    dfa = {
        "nodes": [
            {"id": "D0", "label": "Start"},
            {"id": "D1", "label": "Identifier State"},
            {"id": "D2", "label": "Number State"}
        ],
        "edges": [
            {"from": "D0", "to": "D1", "label": "Letter / _"},
            {"from": "D0", "to": "D2", "label": "Digit"},
            {"from": "D1", "to": "D1", "label": "Letter / Digit / _"},
            {"from": "D2", "to": "D2", "label": "Digit"}
        ],
        "start": "D0",
        "accepting": ["D1", "D2"]
    }

    return jsonify({
        "nfa": nfa,
        "dfa": dfa
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)