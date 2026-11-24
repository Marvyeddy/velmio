# ============================================================
# EC2 instance information
# ============================================================

output "instance_id" {
  description = "ID of the Velmio EC2 instance"
  value       = aws_instance.velmio.id
}

output "instance_type" {
  description = "EC2 instance type"
  value       = aws_instance.velmio.instance_type
}

output "availability_zone" {
  description = "Availability zone of the EC2 instance"
  value       = aws_instance.velmio.availability_zone
}

# ============================================================
# Networking
# ============================================================

output "public_ip" {
  description = "Elastic IP address of the Velmio server"
  value       = aws_eip.velmio.public_ip
}

output "public_dns" {
  description = "Public DNS hostname of the Velmio server"
  value       = aws_eip.velmio.public_dns
}

output "private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.velmio.private_ip
}

output "security_group_id" {
  description = "ID of the Velmio security group"
  value       = aws_security_group.velmio.id
}

# ============================================================
# Connection information
# ============================================================

output "ssh_command" {
  description = "Command to connect to the Velmio server"
  value       = "ssh -i ${trimsuffix(var.ssh_public_key_path, ".pub")} ec2-user@${aws_eip.velmio.public_ip}"
}

output "server_url" {
  description = "Initial HTTP URL of the Velmio server"
  value       = "http://${aws_eip.velmio.public_ip}"
}
