// Simple calculator: digits, +, −, ×, ÷, %, decimal, clear, backspace, equals.
// Evaluation is done with an explicit two-pass parser (no eval), respecting
// × / ÷ before + / −.

let expression = "";
let justEvaluated = false;

function evaluate(expr) {
  // Tokenise into numbers and operators.
  const tokens = [];
  let current = "";
  for (const ch of expr) {
    if ("+−×÷".includes(ch)) {
      if (current === "" && ch === "−" && tokens.length === 0) {
        current = "-"; // leading negative
        continue;
      }
      if (current === "") return null;
      tokens.push(parseFloat(current));
      tokens.push(ch);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current === "") return null;
  tokens.push(parseFloat(current));
  if (tokens.length % 2 === 0) return null;

  // First pass: × and ÷.
  const first = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const next = tokens[i + 1];
    if (op === "×" || op === "÷") {
      if (op === "÷" && next === 0) return null;
      first[first.length - 1] = op === "×"
        ? first[first.length - 1] * next
        : first[first.length - 1] / next;
    } else {
      first.push(op, next);
    }
  }

  // Second pass: + and −.
  let result = first[0];
  for (let i = 1; i < first.length; i += 2) {
    result = first[i] === "+" ? result + first[i + 1] : result - first[i + 1];
  }
  if (!isFinite(result)) return null;
  return Math.round(result * 1e10) / 1e10;
}

function render() {
  if (typeof document === "undefined") return;
  document.getElementById("display").textContent = expression || "0";
}

function inputDigit(digit) {
  if (justEvaluated) { expression = ""; justEvaluated = false; }
  const lastNumber = expression.split(/[+−×÷]/).pop();
  if (digit === "." && lastNumber.includes(".")) return;
  if (digit === "." && lastNumber === "") expression += "0";
  expression += digit;
  render();
}

function inputOperator(op) {
  if (expression === "" && op !== "−") return;
  if (justEvaluated) justEvaluated = false;
  if (/[+−×÷]$/.test(expression)) {
    expression = expression.slice(0, -1) + op;
  } else {
    expression += op;
  }
  render();
}

function inputPercent() {
  const match = expression.match(/(\d+\.?\d*)$/);
  if (!match) return;
  expression = expression.slice(0, -match[0].length) + (parseFloat(match[0]) / 100);
  render();
}

function doEquals() {
  const result = evaluate(expression);
  if (typeof document !== "undefined") {
    const history = document.getElementById("history");
    history.textContent = result === null ? "" : expression + " =";
  }
  expression = result === null ? "" : String(result);
  justEvaluated = true;
  render();
}

if (typeof document !== "undefined") {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "digit") inputDigit(btn.dataset.value);
      else if (action === "operator") inputOperator(btn.dataset.value);
      else if (action === "clear") { expression = ""; justEvaluated = false; document.getElementById("history").textContent = ""; render(); }
      else if (action === "backspace") { expression = expression.slice(0, -1); render(); }
      else if (action === "percent") inputPercent();
      else if (action === "equals") doEquals();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (/^[0-9.]$/.test(e.key)) inputDigit(e.key);
    else if (e.key === "+") inputOperator("+");
    else if (e.key === "-") inputOperator("−");
    else if (e.key === "*") inputOperator("×");
    else if (e.key === "/") { e.preventDefault(); inputOperator("÷"); }
    else if (e.key === "%") inputPercent();
    else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); doEquals(); }
    else if (e.key === "Backspace") expression = expression.slice(0, -1), render();
    else if (e.key === "Escape") { expression = ""; render(); }
  });
}

if (typeof module !== "undefined") module.exports = { evaluate };
