# Terraform — Infrastructure as Code

Provisions the AWS infrastructure for Mobile Job Hunter.

## Modules

| Module                    | Resources                                                              |
|---------------------------|------------------------------------------------------------------------|
| `modules/vpc/`            | VPC, public/private subnets, internet gateway, NAT gateway, route tables (EKS tag-ready) |
| `modules/rds/`            | Managed PostgreSQL 16 — encrypted, backup retention, optional Multi-AZ |
| `modules/eks-cluster/`    | EKS control plane + managed node group + OIDC provider (for IRSA)      |
| `modules/ec2-jenkins/`    | Jenkins EC2 + security group + IAM role (bootstraps Jenkins, Docker, AWS CLI, kubectl, eksctl, helm, Trivy) |

```
terraform/
├── providers.tf            # provider pins + optional S3 backend
├── main.tf                 # wires the four modules together
├── variables.tf            # root input variables
├── outputs.tf              # root outputs
├── terraform.tfvars.example
└── modules/
    ├── vpc/
    ├── rds/
    ├── eks-cluster/
    └── ec2-jenkins/
```

## Prerequisites

- Terraform `>= 1.5.0`
- AWS credentials configured (`aws configure` or environment variables / instance role)

## Usage

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in db_password, key_name, restrict CIDRs
terraform init
terraform plan
terraform apply
```

> `db_password` is a sensitive, required variable — set it in `terraform.tfvars`
> or via `TF_VAR_db_password`. `terraform.tfvars` is git-ignored.

Apply order is handled automatically: the RDS, EKS, and Jenkins modules consume
outputs from the VPC module, so `terraform apply` provisions everything in the
correct order.

## Remote state (recommended)

Create an S3 bucket and DynamoDB lock table, then uncomment the `backend "s3"`
block in `providers.tf` and run:

```bash
terraform init \
  -backend-config="bucket=mjh-terraform-state" \
  -backend-config="key=terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=mjh-terraform-locks"
```

`.tfstate`, `.terraform/`, and `*.tfvars` are already git-ignored.

## Key inputs

| Variable                    | Default      | Notes |
|-----------------------------|--------------|-------|
| `aws_region`                | `us-east-1`  | |
| `vpc_cidr` / subnets        | `10.0.0.0/16`| 2 public + 2 private subnets |
| `db_password`               | *(required)* | master DB password |
| `db_instance_class`         | `db.t3.micro`| |
| `db_multi_az`               | `false`      | enable for production |
| `cluster_name` / `cluster_version` | `mjh-cluster` / `1.30` | use a supported EKS version |
| `node_instance_types`       | `["t3.medium"]` | |
| `jenkins_instance_type`     | `t2.large`   | |
| `jenkins_key_name`          | `""`         | EC2 key pair for SSH |
| `ssh_cidr_blocks` / `jenkins_public_cidr_blocks` | `0.0.0.0/0` | **restrict to your IP** |

## After apply

```bash
# Point kubectl at the new cluster
aws eks update-kubeconfig --region us-east-1 --name mjh-cluster

# Get the Jenkins URL + initial admin password
terraform output jenkins_url
ssh -i <key> ubuntu@$(terraform output -raw jenkins_public_ip) \
  'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'
```

## Cleanup

```bash
terraform destroy
```

> RDS and EKS incur hourly costs even when idle — run `terraform destroy` when
> not in use, or use a smaller instance class for development.
