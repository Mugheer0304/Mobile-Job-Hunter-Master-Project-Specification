# Deploying Mobile Job Hunter to EKS

This directory contains the Kubernetes manifests that deploy the **backend**
(Express API) and **frontend** (Next.js) to your EKS cluster, exposed via
public LoadBalancer URLs.

```text
k8s/
├── namespace.yaml            # namespace "mjh"
├── configmap.yaml            # non-secret backend config (CORS, etc.)
├── backend/
│   ├── deployment.yaml       # backend pods (image: 0304mugheer/mjh-backend)
│   └── service.yaml          # LoadBalancer on port 4000
└── frontend/
    ├── deployment.yaml       # frontend pods (image: 0304mugheer/mjh-frontend)
    └── service.yaml          # LoadBalancer on port 80
```

> If your Docker Hub username is not `0304mugheer`, change it in
> `backend/deployment.yaml`, `frontend/deployment.yaml`, and the Jenkinsfile.

---

## 0. One-time prerequisites (do these once)

### 0.1 Point kubectl at the cluster

```bash
aws eks update-kubeconfig --region us-east-1 --name mjh-cluster
kubectl get nodes   # expect 2 nodes with status Ready
```

### 0.2 Create the Kubernetes Secret (DB + JWT)

The Secret holds `DATABASE_URL` and `JWT_SECRET`. It is created once by hand
and never committed to git.

```bash
# Grab the RDS endpoint from Terraform
cd terraform && terraform output rds_endpoint && cd ..

# Build a strong JWT secret
openssl rand -base64 48

# Create the Secret (replace <password>, <rds-endpoint>, <jwt-secret>)
kubectl create secret generic mjh-backend-secret -n mjh \
  --from-literal=DATABASE_URL='postgresql://mjh:<password>@<rds-endpoint>:5432/mjh?schema=public' \
  --from-literal=JWT_SECRET='<jwt-secret>'
```

`<password>` is your `db_password` from `terraform.tfvars`. The default DB
user and name are both `mjh`.

### 0.3 (CI/CD only) Let Jenkins deploy to the cluster

Your Jenkins EC2 instance uses the IAM role
`mjh-dev-jenkins-role` (project `mjh`, environment `dev`). EKS only trusts the
IAM principal that *created* the cluster plus node roles, so you must map the
Jenkins role into the cluster:

```bash
kubectl edit configmap aws-auth -n kube-system
```

Add a `mapRoles` entry (put it under the existing `mapRoles:` list):

```yaml
mapRoles:
  # ... existing entries (e.g. the mjh-dev-eks-node-role) ...
  - rolearn: arn:aws:iam::<account-id>:role/mjh-dev-jenkins-role
    username: jenkins
    groups:
      - system:masters
```

Get `<account-id>` with `aws sts get-caller-identity --query Account`.

> Skip 0.3 if you plan to deploy with `kubectl` from your own machine only.

---

## 1. Deploy

Pick **either** path.

### Option A — Direct `kubectl` (fastest to see it running)

```bash
cd <repo-root>

# Build + push the images yourself first (see below), or use Jenkins (Option B).
kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

kubectl -n mjh get pods -w   # wait until all pods are Running
```

### Option B — Jenkins CI/CD (full pipeline)

1. On the Jenkins server, install Node.js (the Terraform bootstrap now includes
   it for new instances, but your already-running instance needs a one-off
   install):

   ```bash
   ssh -i <key> ubuntu@<jenkins-public-ip> \
     'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt-get install -y nodejs'
   ```

   > Note: the `ec2-jenkins` bootstrap change means a future `terraform apply`
   > will **recreate** the Jenkins EC2 instance.

2. Set up Jenkins per `../jenkins/README.md` (plugins, credentials, tools).
3. Create the pipeline job pointing at `jenkins/Jenkinsfile`.
4. **Build Now** with `DEPLOY` ticked. The pipeline builds, pushes, and deploys
   the backend, then builds the frontend with the backend's real URL, deploys
   it, and runs smoke tests.

---

## 2. Find your URLs

The LoadBalancers take a couple of minutes to get a hostname:

```bash
kubectl -n mjh get svc mjh-backend mjh-frontend
```

| Service       | URL you open                          |
|---------------|---------------------------------------|
| `mjh-frontend`| `http://<EXTERNAL-IP/hostname>`       |
| `mjh-backend` | `http://<EXTERNAL-IP/hostname>:4000`  |

---

## 3. Test the site in your browser

1. Open the **frontend** URL. You should land on the Jobs page.
2. Check the API is healthy: open `http://<backend-url>:4000/health` — expect
   `{"status":"ok",...}`.
3. **Register** an account (`/register`) or **log in** (`/login`), then browse
   Jobs, Feed, Network, Profile, Messages, and Notifications.
4. Quick API smoke test:

   ```bash
   curl http://<backend-url>:4000/health
   curl http://<backend-url>:4000/api/v1/jobs
   ```

If the frontend loads but API calls fail in the browser, check the pod logs:

```bash
kubectl -n mjh logs deploy/mjh-backend --tail=50
```

---

## 4. Optional — demo seed data

The seed script (`backend/prisma/seed.ts`) creates demo users
(`admin@mjh.dev` / `alice@mjh.dev` / `bob@mjh.dev`, password `Password123!`)
plus sample jobs. It needs a machine that can reach the private RDS endpoint,
so the simplest path right now is to just register accounts through the UI.

---

## 5. Cleanup

```bash
kubectl delete -f k8s/frontend/ -f k8s/backend/ -f k8s/configmap.yaml -f k8s/namespace.yaml
```

Deleting the `LoadBalancer` services also deletes the ELBs (and their cost).
