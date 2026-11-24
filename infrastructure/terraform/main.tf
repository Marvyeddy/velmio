# ============================================================
# Amazon Linux 2023 AMI
# ============================================================

data "aws_ssm_parameter" "amazon_linux" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ============================================================
# Networking
# ============================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

# ============================================================
# SSH key pair
# ============================================================

resource "aws_key_pair" "velmio" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

# ============================================================
# Security group
# ============================================================

resource "aws_security_group" "velmio" {
  name        = "${var.project_name}-sg"
  description = "Security group for Velmio"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name = "${var.project_name}-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.velmio.id

  description = "SSH from trusted IP"
  cidr_ipv4   = var.ssh_allowed_cidr
  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.velmio.id

  description = "Public HTTP access"
  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.velmio.id

  description = "Public HTTPS access"
  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.velmio.id

  description = "Allow outbound traffic"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

# ============================================================
# EC2 instance
# ============================================================

resource "aws_instance" "velmio" {
  ami           = data.aws_ssm_parameter.amazon_linux.value
  instance_type = var.instance_type

  subnet_id = sort(data.aws_subnets.default.ids)[0]

  key_name = aws_key_pair.velmio.key_name

  vpc_security_group_ids = [
    aws_security_group.velmio.id
  ]

  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data.sh", {
    swap_size_gb = var.swap_size_gb
  })

  user_data_replace_on_change = false

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-storage"
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  credit_specification {
    cpu_credits = "standard"
  }

  tags = {
    Name = "${var.project_name}-server"
  }
}

# ============================================================
# Elastic IP
# ============================================================

resource "aws_eip" "velmio" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

resource "aws_eip_association" "velmio" {
  instance_id   = aws_instance.velmio.id
  allocation_id = aws_eip.velmio.id
}
