variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the cluster + node group (private)"
  type        = list(string)
}

variable "node_instance_types" {
  description = "Node group instance types"
  type        = list(string)
}

variable "node_desired_size" {
  description = "Desired node count"
  type        = number
}

variable "node_min_size" {
  description = "Minimum node count"
  type        = number
}

variable "node_max_size" {
  description = "Maximum node count"
  type        = number
}
