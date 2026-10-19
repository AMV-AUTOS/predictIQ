# OpenTelemetry collector wiring for the API ECS tasks.
#
# The API exports traces over OTLP to OTLP_ENDPOINT. Point `otlp_endpoint` at
# an ADOT / OpenTelemetry collector (managed or self-hosted) that is reachable
# from the private subnets, and list the collector's CIDR ranges (or its
# security group) so the ECS tasks may reach OTLP gRPC (4317) and HTTP (4318).

variable "otlp_endpoint" {
  type        = string
  default     = ""
  description = "OTLP collector endpoint, e.g. http://otel-collector.internal:4317. Empty disables the OTLP_ENDPOINT env var."
}

variable "otlp_collector_cidr_blocks" {
  type        = list(string)
  default     = []
  description = "CIDR blocks of the OTLP collector. Egress on 4317/4318 is opened to these ranges."
}

variable "otlp_collector_sg_id" {
  type        = string
  default     = ""
  description = "Security group ID of the OTLP collector. Egress on 4317/4318 is opened to it when set."
}

resource "aws_security_group_rule" "ecs_tasks_egress_otlp_cidr" {
  for_each = length(var.otlp_collector_cidr_blocks) > 0 ? toset(["4317", "4318"]) : toset([])

  type              = "egress"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  protocol          = "tcp"
  security_group_id = aws_security_group.ecs_tasks.id
  cidr_blocks       = var.otlp_collector_cidr_blocks
  description       = "OTLP export to collector"
}

resource "aws_security_group_rule" "ecs_tasks_egress_otlp_sg" {
  for_each = var.otlp_collector_sg_id != "" ? toset(["4317", "4318"]) : toset([])

  type                     = "egress"
  from_port                = tonumber(each.value)
  to_port                  = tonumber(each.value)
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_tasks.id
  source_security_group_id = var.otlp_collector_sg_id
  description              = "OTLP export to collector"
}
