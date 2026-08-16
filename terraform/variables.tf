# ---------------- General ----------------
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Prefix used for resource naming"
  type        = string
  default     = "mjh"
}

# ---------------- VPC ----------------
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets (2 recommended)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnets" {
  description = "CIDRs for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDRs for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

# ---------------- RDS ----------------
variable "db_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = "mjh-postgres"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "mjh"
}

variable "db_username" {
  description = "Master database username"
  type        = string
  default     = "mjh"
}

variable "db_password" {
  description = "Master database password (set via TF_VAR_db_password or tfvars)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GiB"
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for high availability"
  type        = bool
  default     = false
}

# ---------------- EKS ----------------
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "mjh-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version (use a currently-supported EKS version)"
  type        = string
  default     = "1.30"
}

variable "node_instance_types" {
  description = "Instance types for the managed node group"
  type        = list(string)
  default     = ["t3.small"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 4
}

# ---------------- Jenkins ----------------
variable "jenkins_instance_type" {
  description = "EC2 instance type for the Jenkins server"
  type        = string
  default     = "t3.small"
}

variable "jenkins_key_name" {
  description = "EC2 key pair name for SSH access (empty = no key)"
  type        = string
  default     = ""
}

variable "jenkins_ami_owner" {
  description = "AWS account ID owning the Ubuntu AMI (Canonical)"
  type        = string
  default     = "099720109477"
}

variable "ssh_cidr_blocks" {
  description = "CIDRs allowed to SSH into Jenkins (restrict to your IP)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "jenkins_public_cidr_blocks" {
  description = "CIDRs allowed to reach Jenkins UI (8080) and agents (50000)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
