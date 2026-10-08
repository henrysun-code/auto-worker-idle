# Balance Wall V2 review bundle

Read FIRST_COMPANY_BALANCE_WALL_V2/BALANCE_WALL_V2_REPORT.md first.
This is a focused review snapshot, not the entire historical workspace.
Includes all candidate data and current full production src/assets/public/config, new measurement scripts and 59 formal core tests (44 promotion + 15 overlays), four promotion browser tests, and full repository 461-core/32-browser/build evidence.
No candidate applied. No node_modules, Git internals, personal saves or environment secrets.

Reproduce from project root: npm ci; npx tsx scripts/balanceWallSweep.ts;
then npx tsx scripts/balanceWallSweep.ts A-G1.040-C3 A-G1.042-C3 A-G1.045-C3;
python scripts/reportBalanceWall.py; python scripts/finalizeBalanceWall.py; python scripts/packageBalanceWall.py.
Finalization expects the original full repository regression logs and protected hashes already supplied in this bundle.
Running npm test in this focused bundle runs the supplied59 tests, not all461 historical tests.
Browser reproduction: npx playwright test tests/browser/promotion-v1.spec.ts, with Edge as configured.
All paths are calculated from files; production Config is never written by the sweep.
Reproduction replaces this candidate output folder; preserve an existing copy first.
