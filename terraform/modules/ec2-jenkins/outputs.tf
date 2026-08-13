output "jenkins_public_ip" {
  description = "Jenkins server public IP"
  value       = aws_instance.jenkins.public_ip
}

output "jenkins_public_dns" {
  description = "Jenkins server public DNS name"
  value       = aws_instance.jenkins.public_dns
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${aws_instance.jenkins.public_dns}:8080"
}

output "jenkins_instance_id" {
  description = "Jenkins EC2 instance ID"
  value       = aws_instance.jenkins.id
}
