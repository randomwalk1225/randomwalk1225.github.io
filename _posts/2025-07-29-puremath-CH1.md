---
layout: post
title: '모든 정수의 8 세제곱 합 표현 (Korean + English)'
date: 2025-07-29 10:00:00 +0900
---

<!-- Korean Section -->
<section id="korean" lang="ko">
  <h2>문제 9 (b) — 모든 정수의 8 세제곱 합 표현</h2>

  <p><strong>명제 \(P\)</strong>:</p>
  <p>
    \[
      \forall n \in \mathbb{Z},\quad
      \exists a,b,c,d,e,f,g,h \in \mathbb{Z} :
      n = a^3 + b^3 + c^3 + d^3 + e^3 + f^3 + g^3 + h^3.
    \]
  </p>
  <p><em>“모든 정수는 8개의 정수 세제곱의 합으로 표현할 수 있다.”</em></p>

  <p><strong>부정 \(\lnot P\)</strong>:</p>
  <p>
    \[
      \exists n_0 \in \mathbb{Z} \text{ such that }
      \forall a,\dots,h \in \mathbb{Z}, \quad
      n_0 \neq a^3 + \dots + h^3.
    \]
  </p>
  <p><em>“어떤 정수 \(n_0\)는 8개의 세제곱 합으로 표현할 수 없다.”</em></p>

  <hr>

  <h3>1. 핵심 정체성 — \(6k\) 생성 공식</h3>
  <p>
    \[
      (k+1)^3 + (k-1)^3 - k^3 - k^3 = 6k, \quad \forall k \in \mathbb{Z}.
    \]
  </p>
  <p>이 식을 활용하여 임의의 정수 \(n\)을 8개의 세제곱으로 분해할 수 있습니다.</p>

  <hr>

  <h3>2. 표현 절차</h3>
  <ol>
    <li><strong>6으로 나누기:</strong> \( n = 6k + r \), 여기서 \( r \in \{0,1,2,3,4,5\} \)</li>
    <li><strong>\(6k\) 생성:</strong> 네 개의 세제곱으로 구성<br>
        \[
          C_1 = (k+1)^3, \quad C_2 = (k-1)^3, \quad C_3 = C_4 = -k^3
        \]
    </li>
    <li><strong>나머지 \(r\) 생성:</strong> 최대 네 개의 작은 세제곱으로 보완 (아래 표 참조)</li>
    <li><strong>합산:</strong> 최종적으로
        \[
          n = \sum_{i=1}^4 C_i + \sum_{j=1}^4 D_j
        \]
    </li>
  </ol>

  <table>
    <caption>나머지 \(r\) 별 세제곱 선택</caption>
    <thead>
      <tr>
        <th>\(r\)</th>
        <th>\(D_1\)</th>
        <th>\(D_2\)</th>
        <th>\(D_3\)</th>
        <th>\(D_4\)</th>
        <th>합계 \(\sum D_i\)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>0</td><td>0³</td><td>0³</td><td>0³</td><td>0³</td><td>0</td></tr>
      <tr><td>1</td><td>1³</td><td>0³</td><td>0³</td><td>0³</td><td>1</td></tr>
      <tr><td>2</td><td>1³</td><td>1³</td><td>0³</td><td>0³</td><td>2</td></tr>
      <tr><td>3</td><td>1³</td><td>1³</td><td>1³</td><td>0³</td><td>3</td></tr>
      <tr><td>4</td><td>1³</td><td>1³</td><td>1³</td><td>1³</td><td>4</td></tr>
      <tr><td>5</td><td>2³</td><td>(-1)³</td><td>(-1)³</td><td>(-1)³</td><td>5</td></tr>
    </tbody>
  </table>

  <hr>

  <h3>3. 결론</h3>
  <p>따라서 모든 정수 \(n\)에 대해 8개의 정수 세제곱 합으로 표현할 수 있으므로 명제 \(P\)는 참이며, 부정 \(\lnot P\)는 거짓입니다. □</p>

  <h3>추가 (Waring 문제와의 관련성)</h3>
  <ul>
    <li>양의 세제곱만을 사용할 경우 최소 개수는 \(g(3) = 9\)입니다.</li>
    <li>음수를 포함하면 8개로 충분함이 증명되었습니다.</li>
  </ul>
</section>

<!-- English Section -->
<section id="english" lang="en">
  <h2>Problem 9 (b) — Representing Every Integer as a Sum of 8 Cubes</h2>

  <p><strong>Statement \(P\)</strong>:</p>
  <p>
    \[
      \forall n \in \mathbb{Z}, \quad
      \exists a,b,c,d,e,f,g,h \in \mathbb{Z} :
      n = a^3 + b^3 + c^3 + d^3 + e^3 + f^3 + g^3 + h^3.
    \]
  </p>
  <p><em>"Every integer can be expressed as a sum of eight integer cubes."</em></p>

  <p><strong>Negation \(\lnot P\)</strong>:</p>
  <p>
    \[
      \exists n_0 \in \mathbb{Z} \text{ such that }
      \forall a,\dots,h \in \mathbb{Z}, \quad
      n_0 \neq a^3 + \dots + h^3.
    \]
  </p>
  <p><em>"There exists an integer \(n_0\) that cannot be written as a sum of eight cubes."</em></p>

  <hr>

  <h3>1. Core Identity — Generating \(6k\)</h3>
  <p>
    \[
      (k+1)^3 + (k-1)^3 - k^3 - k^3 = 6k, \quad \forall k \in \mathbb{Z}.
    \]
  </p>
  <p>This identity is the foundation for decomposing any integer into the sum of eight cubes.</p>

  <hr>

  <h3>2. Construction Procedure</h3>
  <ol>
    <li><strong>Divide by 6:</strong> Write \( n = 6k + r \) where \( r \in \{0,1,2,3,4,5\} \).</li>
    <li><strong>Generate \(6k\):</strong> Using four cubes:<br>
      \[
        C_1 = (k+1)^3, \quad C_2 = (k-1)^3, \quad C_3 = C_4 = -k^3
      \]
    </li>
    <li><strong>Create the remainder \(r\):</strong> Using up to four small cubes according to the table below.</li>
    <li><strong>Sum up:</strong> The integer is expressed as
      \[
        n = \sum_{i=1}^4 C_i + \sum_{j=1}^4 D_j.
      \]
    </li>
  </ol>

  <table>
    <caption>Choice of Cubes for the Remainder \(r\)</caption>
    <thead>
      <tr>
        <th>\(r\)</th>
        <th>\(D_1\)</th>
        <th>\(D_2\)</th>
        <th>\(D_3\)</th>
        <th>\(D_4\)</th>
        <th>Sum \(\sum D_i\)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>0</td><td>0³</td><td>0³</td><td>0³</td><td>0³</td><td>0</td></tr>
      <tr><td>1</td><td>1³</td><td>0³</td><td>0³</td><td>0³</td><td>1</td></tr>
      <tr><td>2</td><td>1³</td><td>1³</td><td>0³</td><td>0³</td><td>2</td></tr>
      <tr><td>3</td><td>1³</td><td>1³</td><td>1³</td><td>0³</td><td>3</td></tr>
      <tr><td>4</td><td>1³</td><td>1³</td><td>1³</td><td>1³</td><td>4</td></tr>
      <tr><td>5</td><td>2³</td><td>(-1)³</td><td>(-1)³</td><td>(-1)³</td><td>5</td></tr>
    </tbody>
  </table>

  <hr>

  <h3>3. Conclusion</h3>
  <p>Since every integer \(n\) can be decomposed into the sum of eight cubes, statement \(P\) is <strong>true</strong> and its negation is false. □</p>

  <h3>Additional Notes (Waring’s Problem)</h3>
  <ul>
    <li>The minimal number of positive cubes required is \(g(3) = 9\)입니다.</li>
    <li>Allowing negative cubes reduces this number to 8, as proven.</li>
  </ul>
</section>
