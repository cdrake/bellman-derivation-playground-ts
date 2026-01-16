export type Vec = number[];
export type Mat = number[][];

export function identity(n: number): Mat {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export function matScale(A: Mat, c: number): Mat {
  return A.map(row => row.map(v => c * v));
}

export function matSub(A: Mat, B: Mat): Mat {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Matrix shape mismatch");
  }
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

function cloneMat(A: Mat): Mat {
  return A.map(row => row.slice());
}

/**
 * Solve Ax = b using Gaussian elimination with partial pivoting
 */
export function solveLinearSystem(Ain: Mat, bIn: Vec): Vec {
  const A = cloneMat(Ain);
  const b = bIn.slice();
  const n = A.length;

  if (b.length !== n) throw new Error("b length mismatch");

  for (let col = 0; col < n; col++) {
    // Pivot
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-12) {
      throw new Error("Matrix is singular or ill-conditioned");
    }

    [A[col], A[pivot]] = [A[pivot], A[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];

    // Eliminate
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / A[col][col];
      for (let c = col; c < n; c++) A[r][c] -= factor * A[col][c];
      b[r] -= factor * b[col];
    }
  }

  // Back-substitute
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c < n; c++) sum -= A[r][c] * x[c];
    x[r] = sum / A[r][r];
  }
  return x;
}
