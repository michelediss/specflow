# Specflow Operating Guide

Questo documento spiega come adottare e usare il boilerplate Specflow dentro nuovi progetti applicativi (es. una app Vue). Tutti i principi di Spec-Driven Development restano invariati: la verità è nei JSON, le viste `.md` sono generate, ogni AC ha almeno un test e ogni modifica passa prima dalla spec.

## Ruoli e responsabilità

### Architect
- Aggiorna `inputs/*.json`, `inputs/DB.mmd`, `spec/SPEC.json`, `tasks/TASKS.json`, `decisions/DECISIONS.json`.
- Rigenera le viste (`npm run spec:md`) e valida la catena (`npm run chain:check`).
- Condivide i cambi di spec su branch `arch/*` e commit `UC-xx: ...` / `AC-xx: ...`.
- Non modifica il codice dell’app (`src/`, `tests/` dell’app reale).

### Developer
- Lavora sui task `T-xx` implementando codice e test minimi per gli AC collegati.
- Tocca solo `specflow/src/` + `specflow/tests/` se sta mantenendo gli esempi, oppure i file dell’app reale (ad esempio `app/src/` + `app/tests/`).
- Usa `npm run run:task` (o script equivalenti) per `chain:check + dev:guard + test`.
- Non altera le fonti di verità (`inputs/`, `spec/`, `tasks/`, `decisions/`, `inputs/DB.mmd`).

## Come riutilizzare il boilerplate

1. **Clona o copia la cartella `specflow/`** dentro il nuovo repository (o mantienila come subfolder accanto all’app esistente).
2. **Installa le dipendenze** all’interno di `specflow/`:
   ```bash
   cd specflow
   npm install
   ```
3. **Esegui `npm run specflow:init`** se ti servono file base vuoti. Copia i template in `inputs/`, `spec/`, `tasks/`, `decisions/` solo quando mancano.
4. **Modella i requisiti** aggiornando i JSON sotto `inputs/` e `spec/`. Ogni UC deve avere AC collegati e ogni AC deve elencare i test che li copriranno (es. `tests/api/user.test.ts#AC-03`).
5. **Rigenera le viste** con `npm run spec:md` e controlla che la documentazione generata rifletta il nuovo stato.
6. **Valida la catena** `UC → AC → Test → Task` con `npm run chain:check`.
7. **Integra con l’app reale:**
   - Se l’app vive in un’altra cartella (`frontend/`, `backend/`, ecc.), fai riferimento ai percorsi reali quando annoti i test negli AC.
   - Usa commit/branch separati (Specflow vs app) per mantenere chiaro quando stai lavorando sulla spec e quando sul codice.

## Script consigliati

| Script | Uso | Note |
| --- | --- | --- |
| `npm run specflow:init` | Bootstrap dei file JSON/MD mancanti. | Solo quando un file non esiste ancora. |
| `npm run spec:md` | Rigenera tutte le viste `.md`. | Obbligatorio in modalità architect prima del commit. |
| `npm run chain:check` | Verifica che UC/AC/Task/Test siano coerenti. | Da eseguire sempre prima di passare la palla al developer. |
| `npm run dev:guard -- --mode=architect` | Impedisce di toccare codice/test mentre lavori come architect. | Da includere anche in CI su branch `arch/*`. |
| `npm run dev:guard -- --mode=developer` | Impedisce di toccare le fonti di verità mentre lavori come developer. | Usa branch `dev/T-xx-*`. |
| `npm run run:task` | Ciclo completo per i task developer (chain-check + guard + test). | Funziona sui test definiti nel progetto reale. |

## Workflow suggerito per nuovi progetti

1. **Architect**
   - Aggiorna `inputs/*.json` e `spec/SPEC.json` per descrivere il nuovo comportamento (es. UC-02 checkout). Annotare gli AC con i file di test che scriveranno i developer nell’app.
   - Esegui `npm run spec:md`, `npm run chain:check`, `npm run dev:guard -- --mode=architect`.
   - Apri PR/commit `arch/...` con JSON + viste aggiornate.

2. **Developer**
   - Legge `spec/SPEC.md` e `decisions/DECISIONS.md` per capire cosa implementare.
   - Implementa i test/codice nell’app reale (es. `frontend/tests/checkout.spec.ts`), assicurandosi di includere i tag `AC-xx` richiesti.
   - Esegue `npm run chain:check` (per assicurarsi che i file di test referenziati esistano) e `npm run dev:guard -- --mode=developer` (dal folder Specflow) più gli script di build/test dell’app.
   - Consegna su branch `dev/T-xx-*`.

## Coordinare Specflow con un’app Vue (esempio)

- Mantieni due `package.json`: uno in `specflow/` (Specflow) e uno alla root o in `frontend/` (Vue).
- Dal punto di vista git, puoi avere due set di branch paralleli (`arch/...` per specflow, `feature/...` per l’app) oppure integrare i cambi in PR coordinate.
- Quando annoti gli AC, indica percorsi reali dei test Vue, es: `frontend/tests/components/cart.test.ts#AC-05`.
- Se vuoi far girare tutto in CI, aggiungi step che eseguono prima gli script Specflow (catena/guard/md) e poi la pipeline dell’app.

## Regole invarianti

- Non modificare le viste `.md` a mano.
- Ogni AC deve avere almeno un test e puntare a un UC valido.
- Ogni task `T-xx` deve elencare gli AC che soddisfa.
- Le decisioni non si cancellano: si marcano come `superseded` quando vengono sostituite.

Con queste linee guida puoi clonare `specflow/` dentro qualsiasi repository e usarlo come layer di governance/spec per nuove app (Vue, React, backend Node, ecc.) mantenendo chiari i confini tra spec e codice applicativo.
