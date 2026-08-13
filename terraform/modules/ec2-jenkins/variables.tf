variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet ID for the Jenkins instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "key_name" {
  description = "EC2 key pair name (empty = no SSH key)"
  type        = string
  default     = ""
}

variable "ami_owner" {
  description = "AWS account ID owning the Ubuntu AMI"
  type        = string
}

variable "ssh_cidr_blocks" {
  description = "CIDRs allowed to SSH in"
  type        = list(string)
}

variable "jenkins_public_cidr_blocks" {
  description = "CIDRs allowed to reach Jenkins UI (8080) and agents (50000)"
  type        = list(string)
}

variable "root_volume_size" {
  description = "Root volume size in GiB"
  type        = number
  default     = 30
}
