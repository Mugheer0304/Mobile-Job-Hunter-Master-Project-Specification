# Jenkins CI/CD

Declarative pipeline for **Mobile Job Hunter**:

```
Checkout → Install → Unit tests → (SonarQube) → (Dependency-Check)
→ Build backend image → (Trivy) → Push backend
→ Deploy backend (read its URL) → Build frontend (with that URL) → Push frontend
→ Deploy frontend (read its URL) → Smoke tests
```

The frontend bakes `NEXT_PUBLIC_API_URL` into its bundle at **build time**, so
the pipeline deploys the backend first, reads its LoadBalancer URL, and passes
it to the frontend build as a `--build-arg`. That is why the build/deploy
stages are split in this order.

---

## 1. Prerequisites on the Jenkins server

The Terraform bootstrap (`terraform/modules/ec2-jenkins/`) installs Java 17,
**Node.js 20**, Docker, AWS CLI, kubectl, eksctl, helm, and Trivy.

> If your Jenkins EC2 was created *before* the Node.js step was added, install
> Node once by hand:
> ```bash
> ssh -i <key> ubuntu@<jenkins-public-ip> \
>   'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt-get install -y nodejs'
> ```

The pipeline also needs `kubectl` access to the cluster. Map the Jenkins IAM
role (`mjh-dev-jenkins-role`) into the cluster's `aws-auth` ConfigMap — see
`../k8s/README.md` §0.3.

---

## 2. Install Jenkins plugins

**Dashboard → Manage Jenkins → Plugins → Available plugins**, install:

- Docker Pipeline
- SonarQube Scanner *(only if you use `RUN_SONAR`)*
- OWASP Dependency-Check *(only if you use `RUN_DEP_CHECK`)*
- Pipeline: AWS Steps

Node.js and Docker are used directly from the agent (installed in §1).

---

## 3. Add credentials

**Dashboard → Manage Jenkins → Credentials → System → Global credentials
(unrestricted) → Add Credentials**:

| Credential ID         | Kind                  | Username field                  | Password / Secret field        |
|-----------------------|-----------------------|---------------------------------|--------------------------------|
| `github-credentials`  | Username with password| your GitHub username            | `GITHUB_TOKEN` (the PAT)       |
| `docker-hub-creds`    | Username with password| `DOCKER_HUB_USERNAME`           | `DOCKER_HUB_PASSWORD`          |
| `sonar-token`         | Secret text           | —                               | `SONAR_TOKEN` *(only for Sonar)* |

The values are recorded in `jenkins/secrets.env` (git-ignored — never commit
it). For `github-credentials`, GitHub accepts any non-empty username when a
personal access token is supplied as the password.

---

## 4. Pipeline parameters

| Parameter      | Type    | Default | Purpose |
|----------------|---------|---------|---------|
| `GIT_REPO_URL` | string  | placeholder | HTTPS URL of your GitHub repo |
| `DEPLOY`       | boolean | `false` | Deploy to EKS and run smoke tests |
| `RUN_SONAR`    | boolean | `false` | SonarQube static analysis |
| `RUN_DEP_CHECK`| boolean | `false` | OWASP Dependency-Check |
| `RUN_TRIVY`    | boolean | `false` | Trivy container scan |

Security gates default to **off** so a first run succeeds without SonarQube /
Dependency-Check infra. Enable them once those tools are configured.

---

## 5. Configure global tools (only for the optional gates)

**Manage Jenkins → Tools:**

- **JDK** — the system JDK 17 is fine.
- **Node.js** — installed system-wide in §1.
- **SonarQube Scanner** — only if using `RUN_SONAR`.
- **Dependency-Check** — only if using `RUN_DEP_CHECK`.

---

## 6. Create the pipeline job

1. **New Item → Pipeline** (e.g. `mjh-pipeline`).
2. Under **Pipeline**:
   - *Definition = Pipeline script from SCM*
   - *SCM = Git*
   - *Repository URL = your GitHub repo URL*
   - *Credentials = `github-credentials`*
   - *Branch = `main`*
   - *Script Path = `jenkins/Jenkinsfile`*
3. Save, then **Build with Parameters**.
4. Set `GIT_REPO_URL` to your repo URL, tick `DEPLOY`, and **Build**.

---

## 7. Pipeline stages explained

| Stage | What it does | Fails on |
|-------|--------------|----------|
| Checkout | Clones the repo using `github-credentials` | bad repo URL / token |
| Install Dependencies | `npm ci` in `backend/` and `frontend/` | missing lockfile |
| Unit Tests | `npm test` in `backend/` | failing tests |
| SonarQube | Static analysis *(optional)* | quality gate failure |
| Dependency-Check | Scans deps for CVEs *(optional)* | high/critical CVEs |
| Build Backend Image | `docker build` backend, tags `latest` + `BUILD-SHA` | build errors |
| Trivy | Scans the backend image *(optional)* | HIGH/CRITICAL findings |
| Push Backend Image | `docker login` via `docker-hub-creds`, then push | auth / push errors |
| Deploy Backend | `aws eks update-kubeconfig`, `kubectl apply`, wait for LB URL | no kubectl access / missing secret |
| Build Frontend Image | `docker build` with `--build-arg NEXT_PUBLIC_API_URL` | build errors |
| Push Frontend Image | push frontend image | auth / push errors |
| Deploy Frontend | `kubectl apply`, wait for LB URL | no kubectl access |
| Smoke Tests | `curl` backend `/health`, `/api/v1/jobs`, frontend `/jobs` | unreachable app |

---

## 8. Before the first `DEPLOY=true` run

The `Deploy Backend` stage expects a Kubernetes Secret named
`mjh-backend-secret` (in namespace `mjh`) to already exist. Create it once —
see `../k8s/README.md` §0.2.

---

## Notes

- The `SONAR_HOST_URL` environment placeholder in `Jenkinsfile` should be set
  to your SonarQube host before enabling `RUN_SONAR`.
- `DOCKER_HUB_USER` in `Jenkinsfile` defaults to `0304mugheer` — change it to
  your Docker Hub username if different.
