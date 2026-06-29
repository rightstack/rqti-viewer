/**
 * MathLive가 지원하지 않는 \hline을 처리한다.
 * - \hline이 끝에만 있는 경우: 환경 전체를 \underline으로 감쌈
 * - \hline이 중간에 있는 경우: \hline 기준으로 분할하여 윗부분만 underline 처리
 * - 환경 밖: \rule로 대체
 */

interface EnvMatch {
  body: string;
  envName: string;
  colSpec: string;
  startIndex: number;
  endIndex: number;
}

function findEnvironments(latex: string): EnvMatch[] {
  const results: EnvMatch[] = [];
  const beginRe = /\\begin\{([^}]*)\}/g;
  let m: RegExpExecArray | null;

  while ((m = beginRe.exec(latex)) !== null) {
    const envName = m[1];
    const beginTagEnd = m.index + m[0].length;
    let pos = beginTagEnd;

    while (pos < latex.length && latex[pos] === "{") {
      let depth = 1;
      pos++;
      while (pos < latex.length && depth > 0) {
        if (latex[pos] === "{") depth++;
        else if (latex[pos] === "}") depth--;
        pos++;
      }
    }

    const colSpec = latex.slice(beginTagEnd, pos);
    const endTag = `\\end{${envName}}`;
    const endIdx = latex.indexOf(endTag, pos);
    if (endIdx === -1) continue;

    results.push({
      body: latex.slice(pos, endIdx),
      envName,
      colSpec,
      startIndex: m.index,
      endIndex: endIdx + endTag.length,
    });
  }

  return results;
}

function splitAtHline(body: string): [string, string] {
  const parts = body.split(/\\\\\s*\\hline/);
  if (parts.length < 2) {
    const fallback = body.split(/\\hline/);
    return [fallback[0].trim(), fallback.slice(1).join("").trim()];
  }
  const before = parts[0].trim();
  const after = parts.slice(1).join("").replace(/\\hline/g, "").trim();
  return [before, after];
}

export function normalizeHline(latex: string): string {
  const envs = findEnvironments(latex);

  let result = latex;
  for (let i = envs.length - 1; i >= 0; i--) {
    const env = envs[i];
    if (!env.body.includes("\\hline")) continue;

    const [before, after] = splitAtHline(env.body);

    const replaced = after
      ? `\\begin{${env.envName}}${env.colSpec}${before} \\\\ \\overline{${after}}\\end{${env.envName}}`
      : `\\underline{\\begin{${env.envName}}${env.colSpec}${before}\\end{${env.envName}}}`;

    result = result.slice(0, env.startIndex) + replaced + result.slice(env.endIndex);
  }

  result = result.replace(/\\hline/g, "\\rule{10em}{0.5pt}");
  return result;
}
