# Review comment on src/validate.js

Left on the PR that added `looksLikePlainText`:

> This regex — `/^([a-zA-Z]+\s?)*$/` — has catastrophic backtracking:
> nested quantifiers where the inner group can match the same input in
> multiple ways. Try validating a title like `'a'.repeat(40) + '!'` locally
> and watch it hang.
>
> Please rewrite it to be linear-time before this merges. Keep the same
> accept/reject behavior for realistic titles (letters and single spaces
> only), and add a regression test that proves it stays fast on an
> adversarial input.

— reviewer
