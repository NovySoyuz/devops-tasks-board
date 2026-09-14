# Politique de sécurité

## Signaler une vulnérabilité

Si vous découvrez une faille de sécurité dans ce projet (DevOps Tasks Board), merci de **ne pas** ouvrir d'issue publique.

Procédure à suivre :

1. Contactez le mainteneur en privé (message direct GitHub ou email) en décrivant :
   - la nature de la vulnérabilité,
   - les étapes pour la reproduire,
   - l'impact potentiel estimé.
2. Un accusé de réception sera envoyé sous **48h**.
3. Un correctif sera priorisé selon la criticité :

   | Criticité | Délai de correction cible |
   |---|---|
   | Critique | 24 à 72h |
   | Haute | 1 semaine |
   | Moyenne | 1 mois |
   | Basse | Prochaine release planifiée |

4. La faille sera corrigée et testée avant divulgation publique (correctif d'abord, communication ensuite).

## Périmètre couvert

- Backend Node.js/Express (`/backend`)
- Frontend React (`/frontend`)
- Manifests Kubernetes et configuration Docker (`/infra`)
- Pipeline CI/CD GitHub Actions (`/.github/workflows`)

## Bonnes pratiques déjà en place

- Authentification via Auth0 (JWT RS256)
- Analyse statique continue (SonarCloud)
- Scan des dépendances (Dependabot + `npm audit` en CI)
- Scan des images Docker (Trivy en CI)
- Limitation de débit (`express-rate-limit`) contre le brute-force/DDoS
- Validation stricte des payloads (`zod`)
- Secrets jamais commités (variables d'environnement / `kubectl create secret`)
