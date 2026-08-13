# Jenkins CI/CD

Declarative pipeline for **Mobile Job Hunter**:

```
Checkout → Install → Unit tests → SonarQube → OWASP Dependency-Check →
Build images → Trivy scan → Push to Docker Hub → Deploy to EKS (optional) → Smoke tests
```

## Credentials

Secrets are kept in the Jenkins credentials store and referenced **by ID** in
`Jenkinsfile`. The actual values live in `secrets.env` (git-ignored — never
commit it).

Create these credentials in Jenkins: **Dashboard → Manage Jenkins →
Credentials → System → Global credentials (unrestricted) → Add Credentials**.

| Credential ID         | Kind                  | Username / fields                | Value (from `secrets.env`)     |
|-----------------------|-----------------------|----------------------------------|--------------------------------|
| `github-credentials`  | Username with password| Username = `GITHUB_USERNAME`     | Password = `GITHUB_TOKEN` (the PAT) |
| `docker-hub-creds`    | Username with password| Username = `DOCKER_HUB_USERNAME` | Password = `DOCKER_HUB_PASSWORD` |
| `sonar-token`         | Secret text           | —                                | Secret = `SONAR_TOKEN`         |

> For `github-credentials`, GitHub accepts any non-empty username when a
> personal access token is supplied as the password — the token is what
> authenticates.

## Pipeline parameters

| Parameter      | Type    | Purpose                                                        |
|----------------|---------|----------------------------------------------------------------|
| `GIT_REPO_URL` | string  | HTTPS URL of the GitHub repo (set to your real repo URL)        |
| `DEPLOY`       | boolean | Enables the `kubectl apply` deploy + smoke-test stages (default `false`) |

## Global tools to configure in Jenkins

- Node.js (used by the `npm` steps)
- SonarQube Scanner (`sonar-scanner`)
- OWASP Dependency-Check (`dependency-check.sh`)
- Trivy (`trivy`)
- Docker + `kubectl` on the build agent

## Not yet present

The `Deploy to EKS` stage expects `k8s/` manifests at the repo root (roadmap
item). The `SONAR_HOST_URL` and `APP_URL` placeholders in `Jenkinsfile` should
be set to your SonarQube and application hosts.
