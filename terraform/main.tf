# Root module — wires together the VPC, RDS, EKS, and Jenkins modules.
# Apply order is handled automatically via the module references below.

module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
}

module "rds" {
  source = "./modules/rds"

  project_name      = var.project_name
  environment       = var.environment
  identifier        = var.db_identifier
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  multi_az          = var.db_multi_az

  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  vpc_cidr_block = module.vpc.vpc_cidr_block
}

module "eks" {
  source = "./modules/eks-cluster"

  project_name        = var.project_name
  environment         = var.environment
  cluster_name        = var.cluster_name
  cluster_version     = var.cluster_version
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
}

module "jenkins" {
  source = "./modules/ec2-jenkins"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.vpc.vpc_id
  subnet_id                  = module.vpc.public_subnet_ids[0]
  instance_type              = var.jenkins_instance_type
  key_name                   = var.jenkins_key_name
  ami_owner                  = var.jenkins_ami_owner
  ssh_cidr_blocks            = var.ssh_cidr_blocks
  jenkins_public_cidr_blocks = var.jenkins_public_cidr_blocks
}
