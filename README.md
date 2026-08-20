# Mobile Job Hunter (MJH)

A LinkedIn-style professional networking + job search platform. Three-tier
architecture: a React/Next.js frontend, a Node.js + Express (TypeScript) REST
API, and PostgreSQL (with optional Redis caching). Designed to be containerized
and deployed to AWS EKS via a full DevSecOps pipeline (Jenkins, SonarQube,
Trivy, OWASP Dependency-Check), with monitoring, custom domain, and SSL.

> This repository is the **application code** (frontend + backend + database)
> plus the **Jenkins CI/CD pipeline**. The Kubernetes manifests and Terraform
> layers are the remaining roadmap items — the exact steps are documented below.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository Layout](#4-repository-layout)
5. [Data Model](#5-data-model)
6. [Prerequisites](#6-prerequisites)
7. [Local Development (Step by Step)](#7-local-development-step-by-step)
8. [Environment Variables](#8-environment-variables)
9. [Testing & Code Quality](#9-testing--code-quality)
10. [Docker (Build, Run, Push)](#10-docker-build-run-push)
11. [CI/CD Pipeline — Jenkins (Step by Step)](#11-cicd-pipeline--jenkins-step-by-step)
12. [Kubernetes / AWS EKS Deployment](#12-kubernetes--aws-eks-deployment)
13. [Domain, DNS & SSL](#13-domain-dns--ssl)
14. [Monitoring & Logging](#14-monitoring--logging)
15. [Infrastructure as Code (Terraform)](#15-infrastructure-as-code-terraform)
16. [API Reference](#16-api-reference)
17. [Security Practices](#17-security-practices)
18. [Roadmap](#18-roadmap)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Overview

**Product:** Mobile Job Hunter (MJH)
**Concept:** Professional networking + job search — user profiles,
connections/network, job postings, applications, company pages, feed/posts,
messaging, notifications, search, and an admin panel.

**Goals:**

- Production-grade 3-tier web application
- Clean, maintainable, well-tested codebase
- Strong security posture end-to-end (application + infrastructure)
- Fully automated CI/CD with security gates (SAST, dependency, container scans)
- Kubernetes (EKS) deployment with monitoring, logging, and HTTPS

---

## 2. Architecture

```
┌─────────────────────────────┐
│   Tier 1: Presentation      │  React/Next.js SPA (App Router)
│   Frontend (port 3000)      │  TailwindCSS, client-side API client
└──────────────┬───────────────┘
               │ HTTPS / REST (JSON)
┌──────────────▼───────────────┐
│   Tier 2: Application        │  Node.js + Express 4 + TypeScript
│   Backend API (port 4000)    │  JWT auth, Zod validation, rate limiting
│   /api/v1/*                  │
└──────────────┬───────────────┘
               │ Prisma ORM (TLS)
┌──────────────▼───────────────┐
│   Tier 3: Data               │  PostgreSQL 16 (primary store)
│   PostgreSQL + Redis         │  Redis (optional cache/sessions)
└───────────────────────────────┘
```

**Request flow:**

1. Browser hits the Next.js frontend (port `3000`).
2. Frontend calls the REST API at `NEXT_PUBLIC_API_URL` (port `4000`).
3. API authenticates the JWT, validates input with Zod, queries Postgres via Prisma.
4. Responses are paginated JSON (`{ data, meta }`).

---

## 3. Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS |
| Backend    | Node.js 20, Express 4, TypeScript, Zod validation |
| ORM        | Prisma 5 (PostgreSQL) |
| Database   | PostgreSQL 16 |
| Cache      | Redis 7 (optional, via ioredis) |
| Auth       | JWT (15m access + rotating 7d refresh tokens), bcryptjs |
| Testing    | Jest, ts-jest, Supertest |
| Containers | Docker (multi-stage, non-root) |
| CI/CD      | Jenkins (declarative pipeline) **or** GitHub Actions (`ci-cd.yml`) |
| Security   | SonarQube (SAST), OWASP Dependency-Check, Trivy (container scan) |
| Deployment | AWS EKS (Kubernetes), Docker Hub registry |
| Infra (planned) | Terraform, Route 53, ACM, AWS Load Balancer Controller, Prometheus/Grafana, EFK |

---

## 4. Repository Layout

```
mobile-job-hunter/
├── frontend/                  # Next.js app (app/, components/, hooks/, lib/, store/, types/)
│   ├── src/
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── backend/                   # Express API (controllers/, services/, routes/, middleware/, validators/)
│   ├── src/
│   ├── tests/                 # unit + integration tests
│   ├── prisma/                # schema.prisma (source of truth) + seed.ts
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── database/                  # reference SQL DDL + seeders (mirror of Prisma schema)
├── jenkins/                   # CI/CD (option 1)
│   ├── Jenkinsfile            # declarative pipeline
│   ├── secrets.env            # local record of secrets (GIT-IGNORED — never commit)
│   └── README.md              # credential → Jenkins mapping
├── .github/workflows/         # CI/CD (option 2 — drop-in GitHub Actions alternative)
│   ├── ci-cd.yml              # same pipeline as Jenkinsfile
│   └── README.md              # secret/input mapping + setup
├── terraform/                 # IaC (VPC, RDS, EKS, Jenkins EC2)
│   ├── main.tf / variables.tf / outputs.tf / providers.tf
│   ├── terraform.tfvars.example
│   └── modules/{vpc, rds, eks-cluster, ec2-jenkins}/
├── docker-compose.yml         # local dev (postgres + redis + backend + frontend)
├── .gitignore
└── README.md
```

---

## 5. Data Model

Prisma is the source of truth (`backend/prisma/schema.prisma`). `database/schema.sql`
and `database/seeders/seed.sql` mirror it for reference.

**Enums:** `Role` (USER, ADMIN), `EmploymentType`, `JobStatus`, `ApplicationStatus`,
`ConnectionStatus`.

**Tables (18):**

| Table | Purpose |
|-------|---------|
| `users` | Accounts, auth, role |
| `profiles` | Headline, summary, location, avatar |
| `experiences` / `educations` / `skills` | Profile detail |
| `companies` | Company pages |
| `jobs` | Job postings (linked to a company + poster) |
| `applications` | Job applications + status tracking |
| `connections` | Friend/connection requests + status |
| `posts` / `post_likes` / `comments` | Feed |
| `conversations` / `conversation_participants` / `messages` | 1:1 messaging |
| `notifications` | In-app notifications |
| `refresh_tokens` | Hashed rotating refresh tokens |

---

## 6. Prerequisites

- **Node.js 20+** and `npm`
- **Docker** (for local Postgres/Redis and image builds)
- **AWS account + AWS CLI v2** (for EKS/RDS/Route 53 later)
- **Jenkins server** (EC2) for CI/CD — setup in [§11](#11-cicd-pipeline--jenkins-step-by-step)
- Optional: `kubectl`, `eksctl`, `helm`, `terraform` (for deployment)

---

## 7. Local Development (Step by Step)

### Step 1 — Start infrastructure

```bash
docker compose up -d postgres redis
```

### Step 2 — Backend

```bash
cd backend
cp .env.example .env              # adjust DATABASE_URL if needed
npm install
npm run prisma:generate
npm run prisma:migrate            # or: npm run db:push (no migration files)
npm run db:seed                   # demo users + jobs
npm run dev                       # http://localhost:4000
```

Verify: `curl http://localhost:4000/health` → `{"status":"ok", ...}`

### Step 3 — Frontend

```bash
cd frontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL
npm install
npm run dev                       # http://localhost:3000
```

### Demo accounts (from seed)

| Role  | Email          | Password      |
|-------|----------------|---------------|
| Admin | admin@mjh.dev  | `Password123!` |
| User  | alice@mjh.dev  | `Password123!` |
| User  | bob@mjh.dev    | `Password123!` |

### Step 4 — Run the whole stack with Docker Compose

```bash
docker compose up -d --build
# backend: http://localhost:4000  frontend: http://localhost:3000
```

---

## 8. Environment Variables

### Backend (`backend/.env`)

| Variable               | Example                                                        | Notes |
|------------------------|----------------------------------------------------------------|-------|
| `NODE_ENV`             | `development`                                                  | `development` / `test` / `production` |
| `PORT`                 | `4000`                                                         | |
| `DATABASE_URL`         | `postgresql://mjh:mjh@localhost:5432/mjh?schema=public`        | |
| `JWT_SECRET`           | `openssl rand -base64 48`                                      | ≥16 chars; prod rejects the dev default |
| `JWT_ACCESS_EXPIRES_IN`| `15m`                                                          | |
| `JWT_REFRESH_EXPIRES_IN`| `7d`                                                          | |
| `REFRESH_TOKEN_DAYS`   | `7`                                                            | |
| `CORS_ORIGIN`          | `http://localhost:3000`                                        | comma-separated list in prod |
| `FRONTEND_URL`         | `http://localhost:3000`                                        | |
| `REDIS_URL`            | `redis://localhost:6379`                                       | optional |

### Frontend (`frontend/.env.local`)

| Variable              | Example                            |
|-----------------------|------------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1`     |

> **Never commit secrets.** Use `.env` (git-ignored) locally, and AWS Secrets
> Manager / Kubernetes Secrets (or Jenkins credentials) in production.

---

## 9. Testing & Code Quality

```bash
cd backend
npm test                 # unit + integration (health check)
npm run typecheck        # tsc --noEmit
npm run lint
```

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

Current test coverage: `tests/unit/{jwt,password,validators}` +
`tests/integration/health`. (Service/controller integration tests are a roadmap item.)

---

## 10. Docker (Build, Run, Push)

Both apps use multi-stage, non-root Dockerfiles.

### Build

```bash
docker build -t mjh-backend  backend
docker build -t mjh-frontend frontend
```

### Run

```bash
docker run -p 4000:4000 --env-file backend/.env mjh-backend
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 mjh-frontend
```

### Push to Docker Hub (manual)

```bash
docker login -u 0304mugheer          # paste your access token when prompted
docker tag mjh-backend  0304mugheer/mjh-backend:latest
docker tag mjh-frontend 0304mugheer/mjh-frontend:latest
docker push 0304mugheer/mjh-backend:latest
docker push 0304mugheer/mjh-frontend:latest
```

> In CI this is automated in the **Push Images** stage of the Jenkinsfile
> (credentials pulled from Jenkins, not hardcoded).

---

## 11. CI/CD Pipeline

Two equivalent pipelines are provided — pick one:

- **Option A — GitHub Actions** (recommended): `.github/workflows/ci-cd.yml`
  is a drop-in port of the Jenkins pipeline with the same stages and gates.
  Zero infrastructure to maintain; see [`.github/workflows/README.md`](.github/workflows/README.md).
- **Option B — Jenkins**: the original pipeline below
  ([`jenkins/Jenkinsfile`](jenkins/Jenkinsfile)).

### Option A — GitHub Actions

Trigger the full flow (build → push → deploy → smoke tests) from
**Actions → CI/CD → Run workflow** and tick `deploy`. Push/PR runs execute the
CI job (tests + optional quality gates) only. See
[`.github/workflows/README.md`](.github/workflows/README.md) for the secrets
(`DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN`, `AWS_ROLE_TO_ASSUME`, `SONAR_TOKEN`,
`SONAR_HOST_URL`) and variables (`DOCKER_HUB_USER`, `AWS_REGION`, `EKS_CLUSTER`,
`K8S_NAMESPACE`) to configure.

### Option B — Jenkins (Step by Step)

The declarative pipeline lives in `jenkins/Jenkinsfile`:

```
Checkout → Install → Unit tests → SonarQube → OWASP Dependency-Check →
Build images → Trivy scan → Push to Docker Hub → Deploy to EKS (optional) → Smoke tests
```

### Step 1 — Provision a Jenkins EC2 instance

- Launch an Ubuntu EC2 (e.g. `t2.large` / `m` family), open ports `22`, `8080`.
- Attach an IAM role/instance profile with the permissions it needs later
  (ECR/EC2/EKS access — see §12).

### Step 2 — Install the base tools

```bash
# Java 17 (required by Jenkins)
sudo apt-get update && sudo apt-get install -y openjdk-17-jdk

# Jenkins (official apt repo)
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update && sudo apt-get install -y jenkins

# Docker
sudo apt-get install -y docker.io
sudo usermod -aG docker jenkins && sudo systemctl restart jenkins

# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# kubectl, eksctl, helm
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
curl -sSL "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_Linux_amd64.tar.gz" | tar xz -C /tmp && sudo mv /tmp/eksctl /usr/local/bin
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Step 3 — Install security tools

```bash
# Trivy (container scanning)
sudo apt-get install -y wget apt-transport-https gnupg
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update && sudo apt-get install -y trivy

# OWASP Dependency-Check — download + unzip to /opt/dependency-check, add to PATH
# SonarQube — run as a container: docker run -d --name sonarqube -p 9000:9000 sonarqube:lts
```

### Step 4 — Install Jenkins plugins

**Dashboard → Manage Jenkins → Plugins → Available plugins**, install:

- Docker Pipeline
- SonarQube Scanner
- OWASP Dependency-Check
- Kubernetes CLI
- Pipeline: AWS Steps
- (optional) Blue Ocean

### Step 5 — Add credentials

Secrets live in `jenkins/secrets.env` (git-ignored). Create each credential in
**Dashboard → Manage Jenkins → Credentials → System → Global credentials
(unrestricted) → Add Credentials**:

| Credential ID         | Kind                  | Username field                  | Password / Secret field       |
|-----------------------|-----------------------|---------------------------------|--------------------------------|
| `github-credentials`  | Username with password| your GitHub username            | `GITHUB_TOKEN` (the PAT)       |
| `docker-hub-creds`    | Username with password| `DOCKER_HUB_USERNAME`           | `DOCKER_HUB_PASSWORD`          |
| `sonar-token`         | Secret text           | —                               | `SONAR_TOKEN`                  |

> The values are recorded in `jenkins/secrets.env` — copy them from there into
> the Jenkins credentials UI. Never paste real secrets into the Jenkinsfile.
> Full mapping in `jenkins/README.md`.

### Step 6 — Configure global tools

**Manage Jenkins → Tools:** point to JDK 17, Node.js 20, SonarQube Scanner,
and Dependency-Check installs.

### Step 7 — Create the pipeline job

1. **New Item → Pipeline** (e.g. `mjh-pipeline`).
2. Under **Pipeline**, set *Definition = Pipeline script from SCM*, *SCM = Git*,
   *Repository URL = your GitHub repo*, and *Credentials = `github-credentials`*,
   *Branch = `main`*, *Script Path = `jenkins/Jenkinsfile`*.
3. Set the `GIT_REPO_URL` parameter to your repo URL.
4. Save and **Build Now**.

### Step 8 — Pipeline stages explained

| Stage | What it does | Fails on |
|-------|--------------|----------|
| Checkout | Clones the repo using `github-credentials` | bad repo URL / token |
| Install Dependencies | `npm ci` in `backend/` and `frontend/` | missing lockfile |
| Unit Tests | `npm test` in `backend/` | failing tests |
| SonarQube | Static analysis + quality gate | quality gate failure |
| Dependency-Check | Scans deps for known CVEs | high/critical CVEs |
| Build Images | `docker build` backend + frontend, tag `BUILD_NUMBER-SHA` | build errors |
| Trivy | Scans images for HIGH/CRITICAL vulns | findings |
| Push Images | `docker login` via `docker-hub-creds`, then `docker push` | auth / push errors |
| Deploy to EKS | `kubectl apply -f k8s/` — only when `DEPLOY=true` | missing manifests |
| Smoke Tests | `curl /health` and `/api/v1/jobs` — only when `DEPLOY=true` | unreachable app |

---

## 12. Kubernetes / AWS EKS Deployment

### Step 1 — Create the cluster

```bash
eksctl create cluster \
  --name mjh-cluster \
  --region us-east-1 \
  --nodegroup-name mjh-ng \
  --node-type t3.small \  # free-tier eligible
  --nodes 2 --nodes-min 1 --nodes-max 4
```

### Step 2 — Point kubectl at the cluster

```bash
aws eks update-kubeconfig --region us-east-1 --name mjh-cluster
kubectl get nodes
```

### Step 3 — Create the Kubernetes objects

The manifests are included in this repo under [`k8s/`](k8s/README.md) — see that
directory's README for the full deploy guide.

| File | Purpose |
|------|---------|
| `namespace.yaml` | `mjh` namespace |
| `configmap.yaml` | non-secret env (CORS, port, env) |
| `backend/deployment.yaml` + `service.yaml` | backend pods + public LoadBalancer (port 4000) |
| `frontend/deployment.yaml` + `service.yaml` | frontend pods + public LoadBalancer (port 80) |

> Secrets (`DATABASE_URL`, `JWT_SECRET`) are created once with
> `kubectl create secret generic mjh-backend-secret -n mjh ...` — never
> committed. See `k8s/README.md` §0.2.

### Step 4 — Deploy

```bash
kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

> The Jenkins `Deploy to EKS` stage runs `kubectl apply -f k8s/` when `DEPLOY=true`.
> Prefer **Amazon RDS** for Postgres — managed backups, Multi-AZ, and simpler ops.

---

## 13. Domain, DNS & SSL

1. Register/point your domain in **Route 53** (create a Hosted Zone).
2. Request a public certificate in **AWS Certificate Manager (ACM)** for the domain.
3. Install the **AWS Load Balancer Controller** in EKS (via Helm).
4. Create an `Ingress` annotated for an Application Load Balancer (ALB), attaching the ACM cert.
5. In Route 53, add an **A record (alias)** pointing the domain to the ALB.
6. Enforce HTTP → HTTPS redirect at the ALB/Ingress level.

---

## 14. Monitoring & Logging

| Purpose | Tooling |
|---------|---------|
| Metrics (cluster + app) | Prometheus + Grafana (`kube-prometheus-stack` Helm chart) |
| Log aggregation | EFK (Elasticsearch + Fluent Bit + Kibana) or CloudWatch Container Insights |
| Alerting | Alertmanager → Slack / email / PagerDuty |
| Uptime checks | Route 53 health checks |
| Key dashboards | Pod CPU/memory, request latency, error rate, DB connections, HPA events |

Install the monitoring stack:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

---

## 15. Infrastructure as Code (Terraform)

The `terraform/` directory provisions the full environment. Modules:

| Module | Resources |
|--------|-----------|
| `modules/vpc/` | VPC, public/private subnets, NAT, route tables (EKS tag-ready) |
| `modules/rds/` | Managed PostgreSQL 16 (encrypted, backups, optional Multi-AZ) |
| `modules/eks-cluster/` | EKS control plane + managed node group + OIDC provider (IRSA) |
| `modules/ec2-jenkins/` | Jenkins EC2 + security group + IAM role (bootstraps Jenkins/Docker/kubectl/eksctl/helm/Trivy) |

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in db_password, key_name, restrict CIDRs
terraform init
terraform plan
terraform apply
```

- Apply order is automatic (RDS/EKS/Jenkins modules consume the VPC outputs).
- Use a remote S3 backend + DynamoDB lock for shared state (see `providers.tf`).
- `.tfstate`, `.terraform/`, and `*.tfvars` are git-ignored.
- Full walkthrough in `terraform/README.md`.

---

## 16. API Reference

Base URL: `/api/v1`. All list endpoints are paginated (`?page=1&limit=20`).
Health: `GET /health`, `GET /ready`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register |
| POST | `/auth/login` | — | Login (returns access + refresh tokens) |
| POST | `/auth/refresh` | — | Rotate refresh token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/change-password` | Bearer | Change password |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:id` | Bearer | Public profile |
| PATCH | `/users/me` | Bearer | Update account |
| PUT | `/users/me/profile` | Bearer | Upsert profile |
| POST | `/users/me/experience` | Bearer | Add experience |
| DELETE | `/users/me/experience/:id` | Bearer | Remove experience |
| POST | `/users/me/education` | Bearer | Add education |
| DELETE | `/users/me/education/:id` | Bearer | Remove education |
| POST | `/users/me/skills` | Bearer | Add skills |
| DELETE | `/users/me/skills/:name` | Bearer | Remove skill |

### Jobs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs` | — | List / search jobs |
| GET | `/jobs/:id` | — | Job detail |
| POST | `/jobs` | Bearer | Create (recruiter/admin) |
| PATCH | `/jobs/:id` | Bearer | Update |
| DELETE | `/jobs/:id` | Bearer | Delete |

### Applications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/applications` | Bearer | Apply to a job |
| GET | `/applications/mine` | Bearer | My applications |
| GET | `/applications/job/:jobId` | Bearer | Applications for a job (owner/admin) |

### Connections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/connections` | Bearer | Send request |
| GET | `/connections` | Bearer | List connections |
| GET | `/connections/pending` | Bearer | Pending requests |
| PATCH | `/connections/:id` | Bearer | Accept / reject |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts` | Bearer | Feed |
| GET | `/posts/:id` | Bearer | Post detail |
| POST | `/posts` | Bearer | Create post |
| PATCH | `/posts/:id` | Bearer | Update post |
| DELETE | `/posts/:id` | Bearer | Delete post |
| POST | `/posts/:id/like` | Bearer | Like / unlike |
| POST | `/posts/:id/comments` | Bearer | Add comment |

### Companies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/companies` | — | List companies |
| GET | `/companies/:id` | — | Company detail |
| POST | `/companies` | Bearer | Create |
| PATCH | `/companies/:id` | Bearer | Update |
| DELETE | `/companies/:id` | Bearer | Delete |

### Messages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messages/conversations` | Bearer | List conversations |
| POST | `/messages/conversations` | Bearer | Start conversation |
| POST | `/messages/messages` | Bearer | Send message |
| GET | `/messages/conversations/:conversationId/messages` | Bearer | Messages in a conversation |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Bearer | List notifications |
| POST | `/notifications/read` | Bearer | Mark read |

### Admin (ADMIN role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform stats |
| GET | `/admin/users` | List users |
| PATCH | `/admin/users/:id/active` | Enable/disable user |
| PATCH | `/admin/users/:id/role` | Change role |
| DELETE | `/admin/users/:id` | Delete user |

---

## 17. Security Practices

- Passwords hashed with bcrypt (never reversible)
- JWT access tokens (15m) + rotating refresh tokens, stored hashed in DB
- Rate limiting on auth + API routes; strict CORS; Helmet security headers
- Zod input validation on every endpoint (SQLi/XSS protection)
- Prisma parameterized queries (no raw SQL interpolation)
- Non-root Docker containers; secrets externalized via env / Jenkins / Secrets Manager
- CI security gates: SonarQube (SAST), OWASP Dependency-Check, Trivy
- **Secrets are never committed** — `jenkins/secrets.env` and all `.env` files are git-ignored

---

## 18. Roadmap

1. ✅ Application code (frontend + backend + database) + Dockerfiles
2. ✅ CI/CD pipelines — Jenkins (`jenkins/Jenkinsfile`) and GitHub Actions (`.github/workflows/ci-cd.yml`) + credentials wiring
3. ⬜ Provision Jenkins EC2 + install tools/plugins/credentials (follow §11)
4. ✅ Kubernetes manifests (`k8s/`) — deployments + LoadBalancer services
5. ✅ EKS cluster + RDS provisioning
6. ✅ Terraform modules for VPC/RDS/EKS/Jenkins EC2 (`terraform/`)
7. ⬜ Route 53 + ACM + AWS Load Balancer Controller (domain + HTTPS)
8. ⬜ Prometheus/Grafana + EFK observability
9. ⬜ Run the full pipeline end-to-end; fix SonarQube/Trivy/Dependency-Check findings
10. ⬜ Expand backend test coverage (service/controller integration tests)

---

## 19. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `npm run dev` fails in backend | missing `.env` or DB down | `cp .env.example .env`, start Postgres |
| Prisma error `P1001` | Postgres not reachable | check `DATABASE_URL` + `docker compose up -d postgres` |
| `JWT_SECRET must be changed` | prod mode with dev secret | set a real `JWT_SECRET` |
| Jenkins checkout 401 | wrong `github-credentials` | recreate credential with the PAT as password |
| `docker push` denied | not logged in / bad token | recreate `docker-hub-creds`, verify `docker login` |
| Trivy/SonarQube not found | tool not on agent PATH | configure in **Manage Jenkins → Tools** |
| Smoke test fails | `APP_URL` placeholder / no deploy | set `APP_URL`, ensure `DEPLOY=true` after deploy |

---

## License

MIT
# Mobile-Job-Hunter-Master-Project-Specification
