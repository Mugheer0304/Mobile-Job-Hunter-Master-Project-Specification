terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Remote state (recommended for teams). Create the S3 bucket + DynamoDB table
  # first, then uncomment and init with:
  #
  #   terraform init \
  #     -backend-config="bucket=mjh-terraform-state" \
  #     -backend-config="key=terraform.tfstate" \
  #     -backend-config="region=us-east-1" \
  #     -backend-config="dynamodb_table=mjh-terraform-locks"
  #
  # backend "s3" {
  #   bucket         = "mjh-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "mjh-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
}
