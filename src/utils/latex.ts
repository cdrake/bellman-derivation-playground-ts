export function canonicalizeLatex(s: string) {
  // Turn double backslashes into single backslashes for KaTeX
  return s.replace(/\\\\/g, "\\");
}

