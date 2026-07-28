import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const section = (markdown, heading) => {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const end = markdown.indexOf("\n## ", start + marker.length);
  return markdown.slice(start, end === -1 ? undefined : end);
};

test("quality reference defines the complete convention and code-check standards", async () => {
  const quality = await read("skills/references/quality.md");
  const convention = section(quality, "`convention` standard");
  const checks = section(quality, "Code checks (`tdd` refactor gate, `review`)");

  assert.match(convention, /^- lint \/ format \/ typecheck tools \(or "none declared"\)$/m);
  assert.match(convention, /^- error-handling pattern$/m);
  assert.match(convention, /^- test pattern$/m);
  assert.match(convention, /^- security baseline \(input validation, secrets, authz\)$/m);
  assert.match(convention, /^- naming \/ file structure$/m);

  assert.match(checks, /Declared lint\/format\/typecheck must be green\./);
  assert.match(checks, /Code matches the declared `convention`\./);
  assert.match(checks, /Coupling, cohesion, abstraction[\s\S]*sound and idiomatic for the stack/);
});

test("doc coverage defines one coherent public contract and exact severities", async () => {
  const [quality, archive] = await Promise.all([
    read("skills/references/quality.md"),
    read("skills/archive/SKILL.md"),
  ]);
  const coverage = section(quality, "Doc-coverage checks (`review`, `ship` gate)");
  const severity = section(quality, "Severity");

  assert.match(
    coverage,
    /`contract` documents the \*\*full public surface\*\*, including stability obligations for APIs\/interfaces that must not break\./,
  );
  assert.match(coverage, /Env vars \/ config \/ error modes are documented\./);
  assert.match(coverage, /README commands runnable: run build\/test\/lint/);
  assert.match(coverage, /tech-spec `contract`\/`convention` match the code\./);

  assert.match(severity, /lint\/format\/typecheck red \(declared\) -> BLOCK; undeclared -> FIX\./);
  assert.match(severity, /README command inaccurate \/ unrunnable -> BLOCK/);
  assert.match(severity, /`contract` incomplete \/ env-errors undocumented -> FIX\./);
  assert.match(severity, /Code off `convention` \/ non-idiomatic -> FIX \(BLOCK if severe\)\./);

  assert.match(
    archive,
    /contract:[^\n]*full documented public surface, including stability obligations for APIs \/ interfaces that must not break/i,
  );
  assert.doesNotMatch(archive, /contract:[^\n]*stability set/i);
});

test("design and onboard declare the complete quality convention", async () => {
  const [design, onboard, archive] = await Promise.all([
    read("skills/design/SKILL.md"),
    read("skills/onboard/SKILL.md"),
    read("skills/archive/SKILL.md"),
  ]);
  const designDecisions = section(design, "Spec = list of decisions");

  assert.match(designDecisions, /- convention\?/);
  assert.match(designDecisions, /Record `convention`[\s\S]*references\/quality\.md/);
  assert.match(
    onboard,
    /convention` \(covering quality baseline — lint\/format\/typecheck tools, error-handling, test pattern, security baseline, naming\/file structure — read from code; see `\.\.\/references\/quality\.md`\)/,
  );
  assert.match(
    archive,
    /convention:[^\n]*naming, file structure, test patterns, lint\/format\/typecheck tools, error-handling, security baseline/,
  );
});

test("tdd, review, and ship enforce section-local quality gates", async () => {
  const [tdd, review, ship] = await Promise.all([
    read("skills/tdd/SKILL.md"),
    read("skills/review/SKILL.md"),
    read("skills/ship/SKILL.md"),
  ]);
  const refactor = section(tdd, "Refactor");

  assert.match(
    refactor,
    /run declared lint\/typecheck and check formatting without rewriting; if only a rewriting formatter is available, run it only on in-scope files/,
  );
  assert.match(refactor, /evaluate against `convention`/);
  assert.match(refactor, /coupling, cohesion, abstraction, idiomatic for the stack/);
  assert.match(refactor, /See `\.\.\/references\/quality\.md`/);

  assert.match(
    review,
    /2\. \*\*Standards\*\*[^\n]*lint\/format\/typecheck green\?[^\n]*`convention`[^\n]*references\/quality\.md/,
  );
  assert.match(
    review,
    /4\. \*\*Doc-coverage\*\*[^\n]*full public surface, including stability obligations[^\n]*README commands runnable[^\n]*references\/quality\.md/,
  );

  assert.match(
    ship,
    /- README commands runnable; tech-spec `contract`\/`convention` match code \(see `\.\.\/references\/quality\.md`\)\./,
  );
});

test("design clarification resolves facts and asks decisions in dependency order", async () => {
  const design = await read("skills/design/SKILL.md");
  const beforeDesigning = section(design, "Before designing");

  assert.match(beforeDesigning, /Clarify in dependency order\./);
  assert.match(beforeDesigning, /Resolve facts from the repo\/tools/);
  assert.match(beforeDesigning, /ask only the current decision frontier requiring user judgment/);
  assert.match(beforeDesigning, /Don't ask downstream questions before prerequisite decisions/);
  assert.match(
    beforeDesigning,
    /Stop when implementation-affecting contract, data, failure, and test decisions are decided or deferred/,
  );
});
