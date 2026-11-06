# Security Policy

## Supported versions

Pixcue is a static web app. Only the latest deployed version and the `main`
branch receive security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub:
[Report a vulnerability](https://github.com/furkankarli/pixcue/security/advisories/new)
(repository **Security** tab → **Report a vulnerability**).

Include what you can of:

- what the issue is and where it lives (file, URL, or feature)
- steps to reproduce, or a proof of concept
- the impact you expect (for example, script running from a shared link)

You will get an acknowledgement within 7 days. We will keep you updated while we
work on a fix and credit you in the advisory unless you prefer to stay
anonymous.

## Scope

Pixcue runs entirely in the browser, with no server and no accounts. Issues we
especially want to hear about:

- Script injection through shared links: the editor restores its full state from
  the URL, so crafted links must never execute code.
- Unsafe handling of user-provided text, fonts or files.
- Problems in the build, CI or deployment setup, including dependencies.

Out of scope: issues that require a compromised browser or device, and reports
from automated scanners without a demonstrated impact.
