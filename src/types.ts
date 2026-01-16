export type DerivationStep = {
  latex: string;
  ruleId?: string;
  ruleName?: string;
  explanation?: string;
};

export type RewriteRule = {
  id: string;
  name: string;
  /** Optional LaTeX to display for the title */
  nameLatex?: string;

  appliesTo: (latex: string) => boolean;
  transform: (latex: string) => string;
  explanation: string;
};

