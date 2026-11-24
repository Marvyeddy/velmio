variable "aws_region" {
  description = "AWS region for Velmio"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "velmio"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "IPv4 CIDR allowed to connect through SSH"
  type        = string

  validation {
    condition     = can(cidrnetmask(var.ssh_allowed_cidr))
    error_message = "Provide a valid IPv4 CIDR"
  }
}

variable "swap_size_gb" {
  description = "Swap file size in GB"
  type        = number
  default     = 2
}

