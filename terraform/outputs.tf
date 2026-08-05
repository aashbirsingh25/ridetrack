output "instance_id" {
  description = "ID of the RideTrack EC2 instance"
  value       = aws_instance.ridetrack_ec2.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.ridetrack_ec2.public_ip
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ridetrack_sg.id
}
