import React, { useMemo, useState } from "react";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { InlineMath, BlockMath } from "react-katex";
import { LatexRenderer } from "./components/LatexRenderer";
import type { DerivationStep } from "./types";
import { applicableRules, applyRule } from "./ruleEngine";
import { mrpBellmanRules } from "./rules/mrpBellmanRules";
import LinearAlgebraPanel from "./components/LinearAlgebraPanel";
import { canonicalizeLatex } from "./utils/latex";


const START: DerivationStep = {
  latex: "v(s)",
  ruleName: "Start",
  explanation: "Start from the value function for a state s.",
};

export default function App() {
  // Ready for AST rewrites later (not required for these string-based rules).
  useMemo(() => new ComputeEngine(), []);

  const [steps, setSteps] = useState<DerivationStep[]>([START]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const active = steps[activeIndex];
  const rules = useMemo(() => applicableRules(active.latex, mrpBellmanRules), [active.latex]);

  const setActiveLatex = (nextLatex: string) => {
    // Controlled edit creates a new branch from the current step.
    const nextStep: DerivationStep = {
      latex: nextLatex,
      ruleName: "Manual edit",
      explanation: "You edited the expression.",
    };
    setSteps((prev) => prev.slice(0, activeIndex + 1).concat(nextStep));
    setActiveIndex((_) => activeIndex + 1);
  };

  const onApplyRule = (ruleId: string) => {
    const rule = mrpBellmanRules.find((r) => r.id === ruleId);
    if (!rule) return;
    try {
      const next = applyRule(active, rule);
      setSteps((prev) => prev.slice(0, activeIndex + 1).concat(next));
      setActiveIndex((_) => activeIndex + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const next: DerivationStep = {
        latex: active.latex,
        ruleName: `Rule failed: ${rule.name}`,
        explanation: msg,
      };
      setSteps((prev) => prev.slice(0, activeIndex + 1).concat(next));
      setActiveIndex((_) => activeIndex + 1);
    }
  };

  const reset = () => {
    setSteps([START]);
    setActiveIndex(0);
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Bellman Derivation Playground (TypeScript)</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <LatexRenderer value={active.latex} onChange={setActiveLatex} label="Current expression" />

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Rendered (current)</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={reset}>Reset</button>
                <button onClick={() => setActiveIndex((i) => Math.max(0, i - 1))} disabled={activeIndex === 0}>
                  Back
                </button>
              </div>
            </div>
            <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12 }}>
              <BlockMath math={canonicalizeLatex(active.latex)} />
            </div>
          </div>

          <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12 }}>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 6 }}>Explanation</div>
            <div style={{ fontSize: 14, lineHeight: 1.4 }}>
              <strong>{active.ruleName ?? "Step"}</strong>
              <div style={{ marginTop: 6 }}>{active.explanation ?? ""}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Applicable rules</h2>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {rules.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  No rules match this expression. Try typing a step that matches the lecture form, e.g.{" "}
                  <InlineMath math={canonicalizeLatex("\\mathbb{E}[G_t\\mid S_t=s]")} />.
                </div>
              ) : (
                rules.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onApplyRule(r.id)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {r.nameLatex ? (
                        <>
                          {r.name}: <InlineMath math={canonicalizeLatex(r.nameLatex)} />
                        </>
                      ) : (
                        r.name
                      )}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{r.explanation}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Step history</h2>
            <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 520, overflow: "auto" }}>
              {steps.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: idx === activeIndex ? "rgba(0,0,0,0.06)" : "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Step {idx}</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{st.ruleId ?? ""}</span>
                  </div>
                  <div style={{ marginTop: 6, overflowX: "auto" }}>
                    <InlineMath math={canonicalizeLatex(st.latex)} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, opacity: 0.75 }}>
        Suggested path: v(s) → Definition of value → Expand return → Unroll return → Linearity → Define r(s) → Total
        expectation → Substitute value → Assemble Bellman.
      </div>
      <LinearAlgebraPanel />
    </div>
    
  );
}
