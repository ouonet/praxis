# Praxis (agent entrypoint)

You have Praxis. **First action on every user message:** read `bootstrap.md` from this repo, then follow it. If the SessionStart hook already injected the bootstrap, you'll see "Praxis" in your context - proceed from there.

In Claude Code, load native skills with the Skill tool as `praxis:<name>`. In file-read harnesses, use `skills/<name>.md`. Follow loaded skills literally.

User instructions > Praxis skills > defaults.
