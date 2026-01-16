import React, { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import {
  identity,
  matScale,
  matSub,
  solveLinearSystem,
  Mat,
  Vec
} from "../utils/matrix";
import { canonicalizeLatex } from "../utils/latex";

function parseMatrix(text: string): Mat {
  const rows = text
    .trim()
    .split("\n")
    .map(r => r.split(",").map(Number));

  const n = rows.length;
  if (rows.some(r => r.length !== n)) {
    throw new Error("P must be square");
  }
  return rows;
}

function parseVector(text: string, n: number): Vec {
  const v = text.split(",").map(Number);
  if (v.length !== n) throw new Error("R length mismatch");
  return v;
}

export default function LinearAlgebraPanel() {
  const [gamma, setGamma] = useState("0.9");
  const [Ptext, setPtext] = useState("0.5,0.5\n0.2,0.8");
  const [Rtext, setRtext] = useState("1,0");

  const result = useMemo(() => {
    try {
      const g = Number(gamma);
      const P = parseMatrix(Ptext);
      const R = parseVector(Rtext, P.length);

      const A = matSub(identity(P.length), matScale(P, g));
      const V = solveLinearSystem(A, R);

      return { ok: true as const, V };
    } catch (e) {
      return { ok: false as const, error: String(e) };
    }
  }, [gamma, Ptext, Rtext]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 12 }}>
      <h2>Linear Algebra Solution</h2>

      <BlockMath math={canonicalizeLatex("V = (I - \\gamma P)^{-1} R")} />

      <label>γ
        <input value={gamma} onChange={e => setGamma(e.target.value)} />
      </label>

      <label>P (CSV rows)
        <textarea value={Ptext} onChange={e => setPtext(e.target.value)} />
      </label>

      <label>R (CSV)
        <input value={Rtext} onChange={e => setRtext(e.target.value)} />
      </label>

      {result.ok ? (
        <div>
          <strong>V =</strong>{" "}
          <InlineMath math={canonicalizeLatex("[" + result.V.join(", ") + "]")} />
        </div>
      ) : (
        <div style={{ color: "red" }}>{result.error}</div>
      )}
    </div>
  );
}
