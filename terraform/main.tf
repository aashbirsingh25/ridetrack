terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# Security Group for RideTrack EC2 Instance
# ------------------------------------------------------------------------------
resource "aws_security_group" "ridetrack_sg" {
  name        = var.security_group_name
  description = "Security group for RideTrack microservices deployment on EC2"
  vpc_id      = var.vpc_id

  # SSH Access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP Web Traffic
  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS Web Traffic
  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Microservices REST & WebSocket Ports (3000-3004)
  ingress {
    description = "RideTrack Microservices Ports (3000: delivery, 3001: rider, 3002: tracking, 3003: frontend, 3004: eta)"
    from_port   = 3000
    to_port     = 3004
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Rule (Full Egress)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = var.security_group_name
    Project     = var.project_name
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# AWS EC2 Instance for RideTrack Platform
# ------------------------------------------------------------------------------
resource "aws_instance" "ridetrack_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.ridetrack_sg.id]

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name        = "ridetrack-ec2"
    Project     = var.project_name
    Environment = var.environment
  }
}
