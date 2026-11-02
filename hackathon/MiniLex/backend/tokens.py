
import re

KEYWORDS = {
    "int", "float", "double", "char", "void",
    "if", "else", "while", "for", "do",
    "return", "break", "continue",
    "switch", "case", "default",
    "long", "short", "const", "static",
    "main"
}

TOKEN_SPECIFICATION = [
    ("COMMENT", r"//[^\n]*|/\*[\s\S]*?\*/"),

    ("STRING", r'"([^"\\]|\\.)*"'),

    ("CHARACTER", r"'([^'\\]|\\.)'"),

    ("NUMBER", r"\d+(\.\d+)?([eE][+-]?\d+)?"),

    ("IDENTIFIER", r"[a-zA-Z_][a-zA-Z0-9_]*"),

    ("OPERATOR",
     r"==|!=|<=|>=|\+\+|--|&&|\|\||"
     r"\+=|-=|\*=|/=|[+\-*/%=<>!&|^~]"),

    ("DELIMITER", r"[(){}\[\],;:.]"),

    ("WHITESPACE", r"\s+")
]
