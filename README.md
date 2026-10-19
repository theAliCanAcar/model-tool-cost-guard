# Model & Tool Cost Guard

Local token, request, spend, and time budgets.

Standalone ES module. No npm install required. Works in **Node.js 20+** and modern browsers (serve over HTTP for browser demos).

## Install / import

Copy the files into your project, or clone this repository:

```js
import { createCostGuard } from './model-tool-cost-guard.js';
const budget=createCostGuard({limits:{tokens:1000,requests:3,costUsd:0.05}});
budget.consume({tokens:600,costUsd:0.02});
console.log(budget.check({tokens:500,costUsd:0.01})); // allowed: false
```

## Use cases

### 1. Preflight an expensive next request

- **Scenario:** An agent has consumed 600 of its 1,000-token allowance.
- **Outcome:** Reject a projected 500-token call before dispatch.

### 2. Bound a research session

- **Scenario:** Repeated searches and model calls share one local budget.
- **Outcome:** Account for requests, supplied usage costs, tokens, and elapsed time.

## Exports

- `createCostGuard`
- `demoCostGuard`

## Notes

- Keep API keys and secrets out of this module and out of browser storage.
- Treat verification callbacks, ledger writers, and permission checks as trusted application code.
- This library is intentional local reliability plumbing, not a claim of cryptographic attestation unless stated in the source comments.

## License

MIT
