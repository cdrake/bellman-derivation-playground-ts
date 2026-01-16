import type { RewriteRule } from "../types";

/**
 * These rules are intentionally conservative and match the lecture derivation.
 * They operate on LaTeX strings (not a full AST) to keep them predictable early on.
 * You can upgrade these later to Compute Engine JSON rewrites.
 */

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

export const mrpBellmanRules: RewriteRule[] = [
  {
    id: "def-value",
    name: "Definition of value",
    nameLatex: "v(s)=\\mathbb{E}[G_t\\mid S_t=s]",
    appliesTo: (latex) => /v\s*\(\s*s\s*\)/.test(latex) || /v_\s*\\pi\s*\(\s*s\s*\)/.test(latex),
    transform: (latex) => {
      // Replace v(s) or v_\pi(s) with E[G_t | S_t = s]
      const next = latex
        .replace(/v_\s*\\pi\s*\(\s*s\s*\)/g, "\\\\mathbb{E}[G_t\\\\mid S_t=s]")
        .replace(/v\s*\(\s*s\s*\)/g, "\\\\mathbb{E}[G_t\\\\mid S_t=s]");
      return normalize(next);
    },
    explanation: "By definition, the value of state s is the expected return starting from s.",
  },
  {
    id: "def-return",
    name: "Expand return definition",
    nameLatex: "G_t=\\sum_{k=0}^{\\infty}\\gamma^k R_{t+1+k}",
    appliesTo: (latex) => latex.includes("G_t") && !latex.includes("\\\\sum_{k=0}^{\\infty}"),
    transform: (latex) => {
      // Replace G_t with sum_{k=0}^\infty gamma^k R_{t+1+k}
      const next = latex.replace(/G_t/g, "\\\\sum_{k=0}^{\\\\infty} \\\\gamma^k R_{t+1+k}");
      return normalize(next);
    },
    explanation: "Return is the discounted sum of future rewards.",
  },
  {
    id: "unroll-return",
    name: "Unroll return",
    nameLatex: "G_t = R_{t+1} + \\gamma G_{t+1}",
    appliesTo: (latex) => latex.includes("\\\\sum_{k=0}^{\\\\infty}") || latex.includes("R_{t+1+k}"),
    transform: (latex) => {
      // Conservative: replace the exact sum token
      const pat = /\\\\sum_\\{k=0\\}\\^\\{\\\\infty\\}\\s*\\\\gamma\\^k\\s*R_\\{t\\+1\\+k\\}/g;
      if (!pat.test(latex)) {
        throw new Error(
          "Expected the return sum in the form \\\\sum_{k=0}^{\\\\infty} \\\\gamma^k R_{t+1+k}"
        );
      }
      const next = latex.replace(
        pat,
        "R_{t+1} + \\\\gamma\\\\sum_{k=0}^{\\\\infty} \\\\gamma^k R_{t+2+k}"
      );
      return normalize(next);
    },
    explanation: "Split the first reward from the discounted sum (index shift).",
  },
  {
    id: "linearity",
    name: "Linearity of expectation",
    nameLatex: "\\mathbb{E}[X+\\gamma Y\\mid Z]=\\mathbb{E}[X\\mid Z]+\\gamma\\mathbb{E}[Y\\mid Z]",
    appliesTo: (latex) =>
      latex.includes("\\mathbb{E}[") &&
      latex.includes("R_{t+1}") &&
      latex.includes("+") &&
      latex.includes("\\gamma") &&
      latex.includes("\\mid"),
    transform: (latex) => {
      // Parse a pattern like: \mathbb{E}[ <inside> \mid <cond> ]
      const start = latex.indexOf("\\mathbb{E}[");
      if (start < 0) throw new Error("Expected an expression starting with \\\\mathbb{E}[ ... ]");

      const mid = latex.indexOf("\\mid", start);
      if (mid < 0) throw new Error("Expected a conditional bar \\\\mid inside the expectation.");

      const end = latex.lastIndexOf("]");
      if (end < 0 || end < mid) throw new Error("Expected a closing ']' for \\\\mathbb{E}[ ... ].");

      const inside = latex.slice(start + "\\mathbb{E}[".length, mid).trim();
      const cond = latex.slice(mid + "\\mid".length, end).trim();

      // Expect inside: R_{t+1} + \gamma <rest>
      const m2 = inside.match(/^R_\{t\+1\}\s*\+\s*\\gamma\s*(.+)$/);
      if (!m2) throw new Error("Expected inside expectation: R_{t+1} + \\\\gamma ( ... )");

      const rest = m2[1].trim();
      return `\\mathbb{E}[R_{t+1}\\mid ${cond}] + \\gamma\\,\\mathbb{E}[${rest}\\mid ${cond}]`;
    },
    explanation: "Expectation is linear; split sums and pull out constants.",
  },
  {
    id: "define-r",
    name: "Define expected reward",
    nameLatex: "r(s)=\\mathbb{E}[R_{t+1}\\mid S_t=s]",
    appliesTo: (latex) => /\\\\mathbb\{E\}\[R_\{t\+1\}\\\\mid\s*S_t\s*=\s*s\]/.test(latex),
    transform: (latex) => {
      const next = latex.replace(
        /\\\\mathbb\\{E\\}\\[R_\\{t\\+1\\}\\\\\\mid\\s*S_t\\s*=\\s*s\\]/g,
        "r(s)"
      );
      return normalize(next);
    },
    explanation: "Define r(s) as the expected one-step reward from state s.",
  },
  {
    id: "total-expectation-next-state",
    name: "Law of total expectation over next state",
    nameLatex: "\\mathbb{E}[f(S_{t+1})\\mid S_t=s]=\\sum_{s'}p(s'\\mid s)f(s')",
    appliesTo: (latex) =>
      /\\\\mathbb\\{E\\}\\[(G_\\{t\\+1\\}|G_{t\\+1}|\\\\sum_\\{k=0\\}\\^\\{\\\\infty\\}).*\\\\\\mid\\s*S_t\\s*=\\s*s\\]/.test(
        latex
      ),
    transform: (latex) => {
      const pat = /\\\\mathbb\\{E\\}\\[(.+)\\\\\\mid\\s*S_t\\s*=\\s*s\\]/;
      const m = latex.match(pat);
      if (!m) throw new Error("Expected \\\\mathbb{E}[ ... \\\\\\mid S_t = s ]");
      const X = m[1].trim();

      const next = `\\\\sum_{s'} p(s'\\\\\\mid s)\\\\,\\\\mathbb{E}[${X}\\\\\\mid S_{t+1}=s']`;
      return normalize(next);
    },
    explanation: "Condition on S_{t+1} using the law of total expectation (Markov chain transitions).",
  },
  {
    id: "value-substitution",
    name: "Substitute value at next state",
    nameLatex: "\\mathbb{E}[G_{t+1}\\mid S_{t+1}=s']=v(s')",
    appliesTo: (latex) => latex.includes("\\\\mathbb{E}[") && latex.includes("\\\\\\mid S_{t+1}=s'"),
    transform: (latex) => {
      const next = latex
        .replace(/\\\\mathbb\\{E\\}\\[G_\\{t\\+1\\}\\\\\\mid\\s*S_\\{t\\+1\\}=s'\\]/g, "v(s')")
        .replace(/\\\\mathbb\\{E\\}\\[G_{t\\+1}\\\\\\mid\\s*S_\\{t\\+1\\}=s'\\]/g, "v(s')")
        .replace(
          /\\\\mathbb\\{E\\}\\[\\\\sum_\\{k=0\\}\\^\\{\\\\infty\\}\\s*\\\\gamma\\^k\\s*R_\\{t\\+2\\+k\\}\\\\\\mid\\s*S_\\{t\\+1\\}=s'\\]/g,
          "v(s')"
        );
      return normalize(next);
    },
    explanation: "Recognize the expected future return from the next state as v(s').",
  },
  {
    id: "assemble-bellman",
    name: "Assemble Bellman expectation equation",
    nameLatex: "v(s)=r(s)+\\gamma\\sum_{s'}p(s'\\mid s)v(s')",
    appliesTo: (latex) => latex.includes("r(s)") && latex.includes("\\\\sum_{s'}"),
    transform: (latex) => {
      const pat = /^r\\(s\\)\\s*\\+\\s*\\\\gamma\\s*\\\\sum_\\{s'\\}\\s*p\\(s'\\\\\\mid\\s*s\\)\\s*,?\\s*v\\(s'\\)$/;
      if (!pat.test(latex)) {
        const pat2 = /^r\\(s\\)\\s*\\+\\s*\\\\gamma\\s*\\\\sum_\\{s'\\}\\s*p\\(s'\\\\\\mid\\s*s\\)\\\\,\\s*v\\(s'\\)$/;
        if (!pat2.test(latex)) throw new Error("Expected r(s) + \\\\gamma \\\\sum_{s'} p(s'|s) v(s')");
      }
      return "v(s) = r(s) + \\\\gamma \\\\sum_{s'} p(s'\\\\\\mid s) v(s')";
    },
    explanation: "This is the Bellman expectation equation for an MRP.",
  },
];
