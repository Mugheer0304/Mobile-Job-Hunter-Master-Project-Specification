# GitHub Actions CI/CD

Drop-in replacement for the Jenkins pipeline (`jenkins/Jenkinsfile`) — same
stages, same order, same security gates:

```
Checkout → Install → Unit tests → (SonarQube) → (Dependency-Check)
→ Build backend image → (Trivy) → Push backend
→ Deploy backend (read its URL) → Build frontend (with that URL) → Push frontend
→ Deploy frontend (read its URL) → Smoke tests
```

The frontend bakes `NEXT_PUBLIC_API_URL` into its bundle at **build time**, so
the pipeline deploys the backend first, reads its LoadBalancer URL, and passes
it to the frontend build as a `--build-arg` — exactly like the Jenkinsfile.

---

## 1. How the workflow is structured

`ci-cd.yml` has two jobs:

| Job | Runs on | What it does |
|-----|---------|--------------|
| `ci` | every push + PR | `npm ci`, backend unit tests, typechecks, optional SonarQube + OWASP Dependency-Check |
| `build-and-deploy` | push to `main` + manual dispatch | full Jenkins-equivalent flow: build → Trivy → push → deploy → smoke tests |

`build-and-deploy` only runs after `ci` passes, so a failing test or quality
gate blocks the build/push/deploy — the same gate behavior as the single
Jenkins pipeline.

## 2. Triggers & parameters

| Jenkins parameter | GitHub equivalent | Default |
|-------------------|-------------------|---------|
| `GIT_REPO_URL` | not needed — GitHub checks out the repo itself | — |
| `DEPLOY` | dispatch input `deploy` | `false` |
| `RUN_SONAR` | dispatch input `run_sonar` | `false` |
| `RUN_DEP_CHECK` | dispatch input `run_dep_check` | `false` |
| `RUN_TRIVY` | dispatch input `run_trivy` | `false` |

- **Push / PR runs** use the Jenkins defaults (security gates off, no deploy)
  so a first run succeeds without SonarQube / Dependency-Check infra.
- **Manual runs**: Actions → *CI/CD* → *Run workflow* → tick `deploy` (and any
  gates) → *Run workflow*.

## 3. Secrets & variables

**Actions → Settings → Secrets and variables → Actions.**

### Secrets (map 1:1 to Jenkins credentials)

| Jenkins credential | GitHub secret | Notes |
|--------------------|---------------|-------|
| `github-credentials` | `GITHUB_TOKEN` (built-in) | No setup needed — checkout is automatic |
| `docker-hub-creds` | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Docker Hub access token (use a token, not your password) |
| `sonar-token` | `SONAR_TOKEN`, `SONAR_HOST_URL` | Only needed when `run_sonar` is enabled |
| Jenkins IAM role (`mjh-dev-jenkins-role`) | `AWS_ROLE_TO_ASSUME` | See §4 below |

### Variables (optional — sane defaults are hardcoded)

| Variable | Default |
|----------|---------|
| `DOCKER_HUB_USER` | `0304mugheer` |
| `AWS_REGION` | `us-east-1` |
| `EKS_CLUSTER` | `mjh-cluster` |
| `K8S_NAMESPACE` | `mjh` |

## 4. AWS access for the deploy stage (OIDC — recommended)

The deploy stage uses **OIDC federation** instead of long-lived access keys:

1. Create an IAM role (e.g. `mjh-dev-github-actions-role`) with the same
   permissions the Jenkins instance profile had (EKS describe/update, EC2,
   IAM read for `update-kubeconfig`).
2. Trust policy: allow the GitHub repo to assume it via the OIDC provider
   `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`,
   subject `repo:<owner>/<repo>:ref:refs/heads/main`).
3. Set the role ARN in the `AWS_ROLE_TO_ASSUME` secret.

> EKS only trusts the IAM principal that *created* the cluster plus node
> roles, so map the new role into the cluster's `aws-auth` ConfigMap — see
> `k8s/README.md` §0.3 (same steps, but with the GitHub Actions role ARN).

Prefer **not** to use OIDC? Replace the `Configure AWS credentials (OIDC)`
step with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets and
`aws-actions/configure-aws-credentials@v4` without `role-to-assume`.

## 5. Before the first `deploy=true` run

The `Deploy backend` step expects the Kubernetes Secret `mjh-backend-secret`
(namespace `mjh`) to already exist. Create it once — see `k8s/README.md` §0.2.
It is never committed to the repo (same as Jenkins).

## 6. Stage-by-stage mapping

| Jenkins stage | GitHub Actions step | Fails on |
|---------------|---------------------|----------|
| Checkout | `actions/checkout` | — (automatic) |
| Install Dependencies | `npm ci` (backend + frontend) | missing lockfile |
| Unit Tests | `npm test` (backend) | failing tests |
| SonarQube | SonarQube scanner container | quality gate failure |
| Dependency-Check | `dependency-check/Dependency-Check_Action` | HIGH/CRITICAL CVEs (`--failOnCVSS 7`) |
| Build Backend Image | `docker/build-push-action` (tag `run_number-sha7`) | build errors |
| Trivy | `aquasecurity/trivy-action` | HIGH/CRITICAL findings |
| Push Backend Image | `docker/login-action` + `docker push` | auth / push errors |
| Deploy Backend | `kubectl apply` + LB hostname polling | no kubectl access / missing secret |
| Build Frontend Image | build with `NEXT_PUBLIC_API_URL` build-arg | build errors |
| Push Frontend Image | `docker push` | auth / push errors |
| Deploy Frontend | `kubectl apply` + LB hostname polling | no kubectl access |
| Smoke Tests | `curl` backend `/health`, `/api/v1/jobs`, frontend `/jobs` | unreachable app |

## 7. Differences from Jenkins (intentional)

- **Dependency-Check now actually fails on HIGH/CRITICAL CVEs**
  (`--failOnCVSS 7`) — the Jenkinsfile scanned but never enforced the gate.
  Set the gate off (`run_dep_check` unchecked) until the report is clean.
- `node_modules` / `.next` are excluded from the Dependency-Check scan for
  speed; `package-lock.json` files are the CVE source.
- Images are tagged `latest` + `${run_number}-${sha7}` instead of
  `${BUILD_NUMBER}-${sha7}`.
- Docker Hub login uses a **token** (`DOCKERHUB_TOKEN`) instead of a password.
