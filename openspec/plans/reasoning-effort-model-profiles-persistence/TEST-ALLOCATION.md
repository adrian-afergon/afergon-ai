# Preserved-case allocation: 218 cases, separate from new architecture evidence

- **Source Task**: [001](../../tasks/001-reasoning-effort-model-profiles-persistence.md)
- **Source Spec**: [sole ready P1 spec](../../specs/reasoning-effort-model-profiles-persistence/spec-01-compatible-profile-storage.md)
- **Authority**: [corrective index](ARCHITECTURE-PLAN-INDEX.md); ready-with-assumptions plans on the explicitly approved replacement basis; planning publication/new implementation still separately unauthorized.
- **Evidence**: planning enumeration from the actual D test source at8963d8e; no tests executed or results reconstructed.

## Counting and publication basis

`tests/model-profiles-persistence.test.ts` is779 lines and **absent from docs PR104**. Every staged replacement test/helper/table addition counts. `tests/model-profiles.test.ts` is2705 lines and inherited from that docs base: rerun it without re-adding or charging its unchanged contents. No779/906-line wholesale focal-suite transfer is authorized.

There are55 source groups below, expanding to **A35 + B72 + C46 + D65 =218**. Each original expanded case and its semantic assertions is retained once in this allocation. New domain/fake-port/inspection/checker/path-binding cases are additional, never counted as substitutes. Original test identifiers are the exact existing title/template plus its original table argument tuple; line ranges locate definitions/calls in the preserved D file.

The14 `invalidReads` entries at155–170 are: non-object root; models container; profiles container; profile value; active profile shape; dangling active profile; invalid version; unsafe version; escaped quote/backslash keys; empty model; structured model; legacy assignment; null assignment; array assignment. All14 remain independently exercised at **read07, prepare08, acquire11 and update13**. Share fixture data, not these four entrypoint assertions.

## A: 35 read/validation/boundary cases

| ID | Exact source group / range | Expanded | Destination | Retained obligations |
| --- | --- | ---: | --- | --- |
| A01 | captures exact UTF-8 bytes and original formatting,187–194 | 1 | 07 | Same-read Buffer/text, multibyte and formatting |
| A02 | propagates a permission read fault instead of returning missing-file defaults,196–207 | 1 | 07 | EACCES propagates despite misleading existsSync |
| A03 | retains mixed raw assignments and does not rewrite or migrate,209–227 | 1 | 07 | Full loaded shape/raw values/exact disk bytes/no backup |
| A04 | rejects invalid effort %j at its source path,229–234 | 6 | 07 | null/empty/whitespace/mixed-case inherit/number/array, actual path |
| A05 | preserves %s on read,236–238; readableDocuments172–178 | 5 | 07 | Structured inheritance/future/omitted containers/prototype foreign/model-only |
| A06 | rejects %s with the original path,240–242; invalidReads155–170 | 14 | 07 | All14 raw fixtures at reader, no normalization |
| A07 | returns absent-source defaults without creating a file,244–252 | 1 | 07 | Canonical defaults, exists:false, no directory |
| A08 | pure document validation,256–273 | 3 | 06 | Own undefined; inactive malformed path; same object/opaque foreign |
| A09 | compiled inactive boundary,277–293 | 3 | 07 | Emitted reader, built absent read/no file, absent live export |

Subtotal:1+1+1+6+5+14+1+3+3=35.06's additional direct domain matrix is new class evidence, not a relabelled duplicate of A06.

## B: 72 preparation cases

| ID | Exact source group / range | Expanded | Destination | Retained obligations |
| --- | --- | ---: | --- | --- |
| B01 | B2 rejects a string masquerading as a patch object,19–22 | 1 | 08 | Object-only patch error |
| B02 | B2 validates the complete independent candidate after preparation,23–29 | 1 | 08 | Whole source then independent candidate validation |
| B03 | Three B3 clone cases,30–54 | 3 | 08 | Foreign/no-op clone both ways, nested candidate/source mutations |
| B04 | Three B2 materialization cases,55–69 | 3 | 08 | v2 flags/raw version; absent empty no maps; real missing profile |
| B05 | Three B2 source cases,70–88 | 3 | 08 | Ignore inherited/unknown patch; future no-op/nontarget error before clone |
| B06 | B2 T2/T1/exact noncanonical target cases,89–100 | 3 | 08 | Ambiguous aliases; sole stored-key effort path; exact stored model path |
| B07 | Four B1 cases,101–128 | 4 | 08 | Raw foreign fields/version, effort-to-string, legacy model-only, omitted effort |
| B08 | keeps missing-target empty patch raw: %j,304–308 | 4 | 08 | {},models{},profiles{},canonical defaults all retain raw maps/flags |
| B09 | edits existing own profile %s retaining active selection,309–314 | 2 | 08 | __proto__/constructor, candidate content and unchanged prototype |
| B10 | preserves representation and flags: %s,315–331 | 8 | 08 | Every editCases tuple, raw metadata/source, changed/migration/version |
| B11 | materializes safe own profile %s without selecting it,332–340 | 2 | 08 | Own key/data/prototype/activeProfile:null |
| B12 | selects %s without rewriting unrelated slots,341–349 | 3 | 08 | Exact duplicate/sole alias/canonical new plus complete candidate |
| B13 | rejects unsupported agents before clone,350–354 | 1 | 08 | Unsupported error and clone0 |
| B14 | performs no filesystem environment-path or host calls,355–361 | 1 | 08 | All eight original ambient-call spies remain silent |
| B15 | rejects own %s before clone,362–369; fields296–301 | 15 | 08 | model/effort six invalid kinds each plus effort three inherit forms; both patch and nontarget source paths; clone0 |
| B16 | validates whole raw source: %s,370–374 | 14 | 08 | All14 raw fixtures at preparation; original diagnostics and clone0 |
| B17 | rejects non-object patch %j before clone,375–379 | 4 | 08 | null/undefined/array/number; clone0 |

Subtotal:18 pure cases +54 expanded characterizations =72.05 adds direct selection/parity tests, but B06/B12 stay at08 because they also assert candidate/path behavior. No count is moved to05 merely to improve budget.

## C: 46 acquisition cases

| ID | Exact source group / range | Expanded | Destination | Retained obligations |
| --- | --- | ---: | --- | --- |
| C01 | POSIX mode tuples,383–397 | 3 | 11 | New present/default0600; prior0640 unchanged; source mode/bytes, restored umask; only these skip Windows |
| C02 | cleanupFaults,398–418 | 3 | 11 | Original+remove/close/both errors, independent removal, nested AggregateError, intentional partial bytes |
| C03 | backupFaults,419–438 | 7 | 11 | write/fsync/close/open/open-prior/read-prior/sourceRead; error identity/close attempts/source/backup/retry |
| C04 | contradictory/missing/non-Buffer observation tuples,439–450 | 3 | 11 | Both legacy acquire and recheck refuse before mkdir; preserve Buffer-edge diagnostic |
| C05 | snapshotRefusals,451–472 | 21 | 11 | Seven explicit backup/recovery refusals + all14 raw fixtures at acquire; mkdir/open0 where required, prior bytes/existence untouched |
| C06 | completedSnapshots,473–491 | 4 | 11 | Exact create/multibyte/default/reuse; receipt/JSON/byte/fsync/write/remove/default retry/source assertions |
| C07 | sourceConflicts,492–511 | 5 | 11 | Changed/appeared/deleted plus mkdir-time change/appearance; standalone recheck where original, acquire refusal/source/backup assertions |

Subtotal:3+3+7+3+21+4+5=46.10's standalone inspector tests are **new**: they do not replace C05/C06 acquire entrypoint evidence.09's primitive source recheck tests do not replace C07's acquisition timing assertions.

## D: 65 update cases

| ID | Exact source group / range | Expanded | Destination | Retained obligations |
| --- | --- | ---: | --- | --- |
| D01 | D1 integrated invalid patch %s never writes or calls host,555–560 | 15 | 13 | All invalidPatchFields; save/mkdir/host0; source/backup/directory unchanged |
| D02 | D1 corrupt or nontarget invalid source %s never writes,561–567 | 2 | 13 | Parse/recognized errors, no save/mkdir, original bytes/config-only directory |
| D03 | D1 explicit mixed v1 identical effort preserves exact schema and bytes,568–572 | 1 | 12 | Diagnostic result/effective1/exact original/no backup |
| D04 | D2 v2 rechecks after pure final validation before actual saver,573–581 | 1 | 12 | Last validation then conflict/save0/external bytes/no backup; semantic injection replaces brittle call count |
| D05 | D3 cleanup failure keeps original precommit error without false temp guarantee,582–588 | 1 | 13 | Real rename+rm failure/original error, source/completed backup, one temp retained |
| D06 | D2 round-trips own profile %s with metadata and subsequent v2 representations,589–603 | 3 | 13 | work/__proto__/constructor, aliases/raw metadata/other profile/selection, multiple reloads/one backup |
| D07 | D2 absent source structured model-only write snapshots recoverable defaults,604–609 | 1 | 13 | Canonical default backup then real v2 new profile |
| D08 | D1 integrated invalid source %s never saves,610–616 | 14 | 13 | All14 raw fixtures at update; diagnostics/save0/mkdir0/exact bytes/directory |
| D09 | D2 %s detects source %s and prevents saver,617–631 | 6 | 13 | Before backup/save × change/delete/appear; external state, completed snapshot only after acquire, no temp |
| D10 | D3 backup %s failure prevents actual saver,632–636 | 4 | 13 | Real open/write/fsync/close; saver0 and all source/backup invariants |
| D11 | D2 refuses prior malformed or mismatched snapshot %s without save,637–642 | 2 | 13 | Prior bytes protected/save0/source unchanged |
| D12 | D3 saver %s failure preserves source and completed snapshot for retry,643–651 | 5 | 13 | serialize/write/fsync/close/rename, real source/backup/temp invariants, retry receipt/version2 |
| D13 | D3 T2 future candidate refuses before backup or downgrade,652–661 | 1 | 12 | Candidate version3/save0/mkdir0/source intact |
| D14 | D3 T1 invalid candidate prevents backup stage and save,662–669 | 1 | 12 | Invalid candidate/save0/mkdir0/source intact |
| D15 | D3 validates versioned candidate before actual save,670–679 | 1 | 12 | Final policy sees2 before real saver |
| D16 | D2 legacy-only change preserves absent version despite unrelated structured slot,680–686 | 1 | 13 | Raw absent version/effective1/legacy representation/no backup |
| D17 | D2 T2 rejects stale source before invoking snapshot stage,687–697 | 1 | 12 | Deleted source/snapshot0/save0/empty directory |
| D18 | D2 T1 rejects source changed after completed snapshot before save,698–709 | 1 | 12 | Source external bytes/save0/exact completed original backup |
| D19 | D2 first structured change snapshots before real v2 save,710–721 | 1 | 12 | Exact original before saver/version2/result/full saved raw document/directory |
| D20 | D1 T2 rejects own undefined patch before save or snapshot,722–728 | 1 | 13 | Actual target path/save0/mkdir0/source intact |
| D21 | D1 T1 refuses future nominal no-op before write I/O,729–736 | 1 | 12 | Unsupported3/save0/mkdir0/read-open-only/source intact |
| D22 | D1 no-op preserves exact mixed v1 source and prior snapshot,737–744 | 1 | 12 | Raw no-op result/prior arbitrary backup bytes/save0/mkdir0 |

Subtotal:10 at12 +55 at13 =65. At12 these ten old cases use the real constructed UpdateUseCase/Node storage/snapshot/saver, not memory substitutes; they preserve disk/backup assertions.13 changes the shared update-entry binding to the compatibility wrapper so the final full218-case suite exercises original APIs; count that binding replacement churn.12's additional memory fake tests independently prove call ordering and no ambient I/O.

## Destination reconciliation and fixture ownership

| Slice | Original expanded cases | Additional evidence, outside218 |
| --- | ---: | --- |
| 05 | 0 | Concrete identity/target class and legacy parity |
| 06 | 3 | Complete direct domain class matrix and supported-version/recovery policy |
| 07 | 32 | Observation injection/constructor behavior; owns shared raw/readable fixture data and initial setup |
| 08 | 72 | Class preparation seam; reused named tables retain every B entrypoint assertion |
| 09 | 0 | Trusted legacy atomic primitives, identity/path/cwd pinning and source comparison |
| 10 | 0 | Real inspector standalone behavior; shared snapshot fixture/expected-state helpers |
| 11 | 46 | Acquire injection/race seams; owns descriptor-aware snapshot fault helper |
| 12 | 10 | Memory port order/failures; synthetic negative graph/checker fixtures and positive constructors |
| 13 | 55 | Final compatibility/environment composition and targeted native Windows execution |
| **Total** | **218** | New tests have separate exact-cycle/result ownership |

Source helpers are fixtures, not extra cases: createConfig/loadDocument/assertions138–153; snapshotFixture516–529; snapshotFault531–552; writerEnv750–752; configFault754–779.07 owns initial read/raw setup,10 snapshot setup,11 snapshot fault stages,13 real saver fault stages. Shared definitions are charged when first published; edits/replacements later count both sides. Do not charge unchanged inherited2705-line regression contents or skip any original focal case because its data fixture is shared.

## Evidence and acceptance

Produced: unchanged static55-group/218-case ledger and approved replacement basis. Not applicable now: tests. Outstanding: parent targeted readiness re-review, separately authorized planning publication/renewed Implement gate and future exact assertions/seam TDD/native evidence. All plans ready-with-assumptions for local fixture/source estimates only; no count/behavior allocation changed, counts not budget caps/proof. No delegation here.
