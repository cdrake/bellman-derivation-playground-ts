import React, { useMemo } from "react";
import { BlockMath } from "react-katex";
import { canonicalizeLatex } from "../utils/latex";

export type LatexRendererProps = {
  value: string;
  onChange: (nextValue: string) => void;
  label?: string;
  rows?: number;
  placeholder?: string;
};


export function LatexRenderer({
  value,
  onChange,
  label = "LaTeX",
  rows = 4,
  placeholder = "Enter LaTeX, e.g., \\mathbb{E}[G_t\\mid S_t=s]",
}: LatexRendererProps) {
  const math = useMemo(() => canonicalizeLatex(value), [value]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{label}</h2>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Tip: use single backslashes (\mathbb, \mid). We’ll auto-fix double slashes.
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(canonicalizeLatex(e.target.value))}
        rows={rows}
        style={{ width: "100%", fontFamily: "monospace" }}
        placeholder={placeholder}
      />

      <div>
        <div style={{ fontSize: 14, marginBottom: 6, opacity: 0.8 }}>Rendered</div>
        <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12 }}>
          <BlockMath math={math} />
        </div>
      </div>
    </div>
  );
}

export default LatexRenderer;
