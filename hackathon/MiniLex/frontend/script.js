
const API_URL = "";

// Store the latest analysis results
let allTokens = [];
let allErrors = [];
let automataData = null;

// HTML safety
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Analyze source code
document.getElementById("analyzeBtn").addEventListener("click", analyzeCode);

async function analyzeCode() {
    const code = document.getElementById("codeInput").value;

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed");
        }

        allTokens = data.tokens || [];
        allErrors = data.errors || [];

        displayTokens(allTokens);
        displayStatistics(data.statistics);
        displayErrors(allErrors);

        document.getElementById("errorMessage").textContent =
            "Analysis completed successfully.";

    } catch (error) {
        document.getElementById("errorMessage").textContent =
            "Error: " + error.message;
    }
}

// Display tokens
function displayTokens(tokens) {
    const tableBody = document.getElementById("tokenTableBody");

    if (!tokens.length) {
        tableBody.innerHTML =
            '<tr><td colspan="4">No tokens found.</td></tr>';
        return;
    }

    tableBody.innerHTML = tokens.map(token => `
        <tr>
            <td>${escapeHTML(token.token)}</td>
            <td>${escapeHTML(token.lexeme)}</td>
            <td>${escapeHTML(token.line)}</td>
            <td>${escapeHTML(token.column ?? "-")}</td>
        </tr>
    `).join("");
}

// Search and filter tokens
document.getElementById("searchToken").addEventListener("input", filterTokens);
document.getElementById("tokenFilter").addEventListener("change", filterTokens);

function filterTokens() {
    const search = document.getElementById("searchToken")
        .value.toLowerCase();

    const filter = document.getElementById("tokenFilter").value;

    const filtered = allTokens.filter(token => {
        const matchesSearch =
            token.lexeme.toLowerCase().includes(search) ||
            token.token.toLowerCase().includes(search);

        const matchesType =
            filter === "ALL" || token.token === filter;

        return matchesSearch && matchesType;
    });

    displayTokens(filtered);
}

// Display statistics
function displayStatistics(statistics) {
    document.getElementById("totalTokens").textContent =
        statistics?.total_tokens ?? allTokens.length;

    document.getElementById("totalErrors").textContent =
        statistics?.total_errors ?? allErrors.length;

    const chart = document.getElementById("tokenChart");
    const counts = statistics?.token_counts || {};

    const entries = Object.entries(counts);

    if (!entries.length) {
        chart.textContent = "No token statistics available.";
        return;
    }

    const maximum = Math.max(...entries.map(([, count]) => count));

    chart.innerHTML = entries.map(([type, count]) => {
        const width = maximum ? (count / maximum) * 100 : 0;

        return `
            <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between">
                    <span>${escapeHTML(type)}</span>
                    <strong>${count}</strong>
                </div>
                <div style="height:9px;background:var(--border);
                            border-radius:8px;margin-top:5px">
                    <div style="height:9px;width:${width}%;
                                background:var(--accent);
                                border-radius:8px"></div>
                </div>
            </div>
        `;
    }).join("");
}

// Display lexical errors
function displayErrors(errors) {
    const errorList = document.getElementById("errorList");

    if (!errors.length) {
        errorList.textContent = "No lexical errors detected.";
        return;
    }

    errorList.innerHTML = errors.map(error => `
        <div class="recognition-step">
            <strong>${escapeHTML(error.message || "Lexical error")}</strong>
            <br>
            Character: ${escapeHTML(error.character)}
            | Line: ${escapeHTML(error.line)}
            | Column: ${escapeHTML(error.column ?? "-")}
        </div>
    `).join("");
}

// CSV report download
document.getElementById("downloadCSV").addEventListener("click", () => {
    if (!allTokens.length) {
        alert("Please analyze some code first.");
        return;
    }

    const rows = [
        ["Token Type", "Lexeme", "Line", "Column"],
        ...allTokens.map(token => [
            token.token,
            token.lexeme,
            token.line,
            token.column ?? ""
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    ).join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "MiniLex_Token_Report.csv";
    link.click();

    URL.revokeObjectURL(url);
});

// Load NFA and DFA
async function loadAutomata() {
    try {
        const response = await fetch(`${API_URL}/automata`);

        if (!response.ok) {
            throw new Error("Unable to load automata");
        }

        automataData = await response.json();

    } catch (error) {
        document.getElementById("automataDisplay").textContent =
            error.message;
    }
}

function displayAutomata(type) {
    if (!automataData) {
        document.getElementById("automataDisplay").textContent =
            "Automata data is not loaded yet.";
        return;
    }

    const automata = automataData[type];

    const nodes = automata.nodes.map(node => `
        <span class="automata-node">
            ${escapeHTML(node.id)}: ${escapeHTML(node.label)}
            ${automata.accepting.includes(node.id) ? " ✓" : ""}
        </span>
    `).join("");

    const edges = automata.edges.map(edge => `
        <div class="automata-edge">
            ${escapeHTML(edge.from)}
            → ${escapeHTML(edge.to)}
            (${escapeHTML(edge.label)})
        </div>
    `).join("");

    document.getElementById("automataDisplay").innerHTML = `
        <h3>${type.toUpperCase()}</h3>
        <p>Start State: ${escapeHTML(automata.start)}</p>
        <p>Accepting States: ${automata.accepting.map(escapeHTML).join(", ")}</p>
        <h4>States</h4>
        ${nodes}
        <h4 style="margin-top:15px">Transitions</h4>
        ${edges}
    `;
}

document.getElementById("showNFA").addEventListener("click", () => {
    displayAutomata("nfa");
});

document.getElementById("showDFA").addEventListener("click", () => {
    displayAutomata("dfa");
});

loadAutomata();

// Step-by-step token recognition
document.getElementById("recognizeBtn")
    .addEventListener("click", recognizeToken);

function recognizeToken() {
    const value = document.getElementById("recognitionInput")
        .value.trim();

    const result = document.getElementById("recognitionResult");

    if (!value) {
        result.textContent = "Please enter a lexeme.";
        return;
    }

    const steps = [];
    let type = "INVALID";

    const keywords = [
        "int", "float", "double", "char", "void",
        "if", "else", "while", "for", "do",
        "return", "break", "continue", "switch",
        "case", "default", "long", "short",
        "const", "static", "main"
    ];

    steps.push(`Input received: ${escapeHTML(value)}`);

    if (keywords.includes(value)) {
        type = "KEYWORD";
        steps.push("Checking keyword list: Match found.");
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        type = "IDENTIFIER";
        steps.push("First character is a letter or underscore.");
        steps.push("Remaining characters are letters, digits or underscores.");
        steps.push("Identifier pattern accepted.");
    } else if (/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
        type = "NUMBER";
        steps.push("Checking numeric pattern.");
        steps.push("Number pattern accepted.");
    } else if (/^"([^"\\]|\\.)*"$/.test(value)) {
        type = "STRING";
        steps.push("Checking double-quoted string pattern.");
        steps.push("String pattern accepted.");
    } else if (/^'([^'\\]|\\.)'$/.test(value)) {
        type = "CHARACTER";
        steps.push("Checking character literal pattern.");
        steps.push("Character pattern accepted.");
    } else if (/^(==|!=|<=|>=|\+\+|--|&&|\|\||\+=|-=|\*=|\/=|[+\-*/%=<>!&|^~])$/.test(value)) {
        type = "OPERATOR";
        steps.push("Checking operator pattern.");
        steps.push("Operator pattern accepted.");
    } else if (/^[(){}\[\],;:.]$/.test(value)) {
        type = "DELIMITER";
        steps.push("Checking delimiter pattern.");
        steps.push("Delimiter pattern accepted.");
    } else {
        steps.push("No supported token pattern matched.");
    }

    result.innerHTML = `
        <h3>Recognition Result: ${type}</h3>
        ${steps.map((step, index) => `
            <div class="recognition-step">
                Step ${index + 1}: ${step}
            </div>
        `).join("")}
    `;
}

// Dark / Light Theme
document.getElementById("themeToggle")
    .addEventListener("click", () => {
        document.body.classList.toggle("light-theme");

        const lightMode =
            document.body.classList.contains("light-theme");

        document.getElementById("themeToggle").textContent =
            lightMode ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
