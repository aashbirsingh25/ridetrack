variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-north-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 24.04 LTS"
  type        = string
  default     = "ami-05bfa4a7765f38076"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "ridetrack-key"
}

variable "security_group_name" {
  description = "Security group name"
  type        = string
  default     = "ridetrack-sg"
}

variable "vpc_id" {
  description = "VPC ID for security group deployment (optional, uses default VPC if empty)"
  type        = string
  default     = null
}

variable "project_name" {
  description = "Project tagging identifier"
  type        = string
  default     = "RideTrack"
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "Production"
}
