
from lexer import tokenize

# Sample program
source_code = """
int age = 20;
float marks = 95.5;
if (age >= 18) {
    marks = marks + 2;
}
@ 
"""

tokens, errors = tokenize(source_code)

print("===== MINI LEX TOKEN REPORT =====")

for item in tokens:
    print(
        f"Token: {item['token']:<12} "
        f"Lexeme: {item['lexeme']:<10} "
        f"Line: {item['line']}"
    )

print("\n===== LEXICAL ERRORS =====")

for error in errors:
    print(
        f"Invalid Character: {error['character']} "
        f"Line: {error['line']}"
    )
