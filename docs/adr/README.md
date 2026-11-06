# Architecture Decision Records

Short records of decisions that shape the codebase: what we chose, why, and what
it costs. They explain the "why" behind code that might otherwise look
arbitrary.

| ADR                                              | Decision                                     | Status   |
| ------------------------------------------------ | -------------------------------------------- | -------- |
| [0001](0001-typescript-framework-free-engine.md) | TypeScript everywhere, framework-free engine | Accepted |
| [0002](0002-solid-only-in-studio.md)             | Solid only in the editor                     | Accepted |
| [0003](0003-webcodecs-over-wasm.md)              | WebCodecs instead of WASM encoders           | Accepted |
| [0004](0004-png-codec-mov-for-transparency.md)   | PNG-codec MOV for transparent video          | Accepted |
| [0005](0005-cloudflare-workers-static-assets.md) | Cloudflare Workers static assets for hosting | Accepted |

## Writing a new ADR

Copy the structure of an existing record into `NNNN-short-title.md` with the
next number, and keep it to one page: **Status**, **Context**, **Decision**,
**Consequences**. Records are not edited after they are accepted; if a decision
changes, write a new ADR that supersedes the old one and update the old one's
status.
