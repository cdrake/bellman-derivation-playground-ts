import type { DerivationStep, RewriteRule } from "./types";

export function applicableRules(latex: string, rules: RewriteRule[]): RewriteRule[] {
  return rules.filter((r) => {
    try {
      return r.appliesTo(latex);
    } catch {
      return false;
    }
  });
}

export function applyRule(current: DerivationStep, rule: RewriteRule): DerivationStep {
  const nextLatex = rule.transform(current.latex);
  return {
    latex: nextLatex,
    ruleId: rule.id,
    ruleName: rule.name,
    explanation: rule.explanation,
  };
}
