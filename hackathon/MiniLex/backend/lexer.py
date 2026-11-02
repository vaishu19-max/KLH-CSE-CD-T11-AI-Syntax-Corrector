
import re
from tokens import KEYWORDS, TOKEN_SPECIFICATION


def tokenize(source_code):

    tokens = []
    errors = []

    line = 1
    column = 1
    position = 0

    while position < len(source_code):

        current_char = source_code[position]

        # Ignore whitespace
        if current_char.isspace():

            if current_char == "\n":
                line += 1
                column = 1
            else:
                column += 1

            position += 1
            continue

        matched = False

        # Check all token patterns
        for token_type, pattern in TOKEN_SPECIFICATION:

            match = re.match(pattern, source_code[position:])

            if not match:
                continue

            lexeme = match.group()

            if not lexeme:
                continue

            matched = True

            start_line = line
            start_column = column

            # Ignore comments
            if token_type != "COMMENT":

                if token_type == "IDENTIFIER":
                    if lexeme in KEYWORDS:
                        token_type = "KEYWORD"

                tokens.append({
                    "token": token_type,
                    "lexeme": lexeme,
                    "line": start_line,
                    "column": start_column
                })

            # Update line and column
            newlines = lexeme.count("\n")

            if newlines:
                line += newlines
                column = len(lexeme.rsplit("\n", 1)[-1]) + 1
            else:
                column += len(lexeme)

            position += len(lexeme)
            break

        # Invalid character detection
        if not matched:

            errors.append({
                "character": current_char,
                "line": line,
                "column": column,
                "message": f"Invalid character: {current_char}"
            })

            position += 1
            column += 1

    return tokens, errors
