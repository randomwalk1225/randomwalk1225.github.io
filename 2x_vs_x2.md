# Comparing \(2^x\) and \(x^2\)

Here’s a clean way to compare \(2^x\) and \(x^2\) for real \(x\).

## Key idea (turn it into a sign test)
For \(x
eq 0\),
\[
\ln\!\left(rac{2^x}{x^2}ight)= x\ln 2 - 2\ln|x| \;\;=: F(x).
\]
Because \(\ln\) is strictly increasing,  
\(\;2^x > x^2 \iff F(x)>0\), \(\;2^x = x^2 \iff F(x)=0\), \(\;2^x < x^2 \iff F(x)<0\).

## Shape of \(F(x)\)
\[
F'(x)=\ln 2 - rac{2}{x},\qquad 
F''(x)=rac{2}{x^2}>0 	ext{ for } x
eq 0.
\]
Thus \(F\) is:
- strictly increasing on \((-\infty,0)\) (since \(F'(x)=\ln 2-2/x>0\) for \(x<0\)),
- strictly decreasing on \((0,\;2/\ln 2)\),
- strictly increasing on \((2/\ln 2,\;\infty)\),
with \(2/\ln 2pprox 2.885\). Also \(F(x)	o+\infty\) as \(x	o 0^\pm\), and \(F(x)	o -\infty\) as \(x	o -\infty\).

## Intersections \(2^x=x^2\)
- Positive, obvious solutions: \(x=2\) and \(x=4\) (since \(2^2=4=2^2\) and \(2^4=16=4^2\)).
- On \((0,\infty)\), the behavior above implies these are the **only** positive solutions, with \(F\) dipping below 0 between them.
- On \((-\infty,0)\), monotonicity gives exactly one negative solution, found numerically (e.g., Newton’s method on \(f(x)=2^x-x^2\), \(f'(x)=2^x\ln2-2x\)) at
\[
xpprox -0.7666646959.
\]

## Final comparison (all real \(x\))
\[
egin{aligned}
2^x &< x^2 &	ext{for }& x< -0.7666646959\ldots \;\; 	ext{or}\;\; 2<x<4,\\
2^x &= x^2 &	ext{at }& xpprox -0.7666646959\ldots,\; 2,\; 4,\\
2^x &> x^2 &	ext{for }& -0.7666646959\ldots < x<2 \;\; 	ext{or}\;\; x>4.
\end{aligned}
\]

## (Optional) How to get the negative root quickly
Newton iteration:
\[
x_{n+1}=x_n-rac{2^{x_n}-x_n^2}{2^{x_n}\ln2-2x_n},\quad x_0=-1
\]
converges to \(-0.7666646959\ldots\) in a few steps.
