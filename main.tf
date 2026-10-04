provider "google" {
  project = var.project
  region  = var.region
}

variable "project" {
  type    = string
  default = "chalkstudio-508318"
}

variable "region" {
  type    = string
  default = "europe-central2"
}

variable "pg_user" {
  type        = string
  description = "PG_USER: database login the app connects with."
}

variable "pg_pass" {
  type        = string
  description = "PG_PASS: password for pg_user."
  sensitive   = true
  validation {
    condition     = length(var.pg_pass) >= 8 && !strcontains(var.pg_pass, var.pg_user)
    error_message = "pg_pass must be at least 8 characters and must not contain pg_user (Cloud SQL password policy)."
  }
}

variable "pg_name" {
  type        = string
  description = "PG_NAME: name of the application database."
}

variable "jwt_secret" {
  type        = string
  description = "JWT_SECRET: signing key for access tokens."
  sensitive   = true
}

variable "enable_cloud_sql" {
  type        = bool
  default     = false
  description = "Create the Cloud SQL instance, database and user. Off during local development, which uses docker-compose Postgres."
}

variable "google_client_id" {
  type        = string
  description = "GOOGLE_CLIENT_ID: OAuth client ID for Google sign-in."
}

variable "google_auth_secret" {
  type        = string
  description = "GOOGLE_AUTH_SECRET: OAuth client secret for Google sign-in."
  sensitive   = true
}

variable "github_client_id" {
  type        = string
  description = "GITHUB_CLIENT_ID: OAuth client ID for GitHub sign-in."
}

variable "github_auth_secret" {
  type        = string
  description = "GITHUB_AUTH_SECRET: OAuth client secret for GitHub sign-in."
  sensitive   = true
}

locals {
  service_name = "chalkstudio"
  # Derived rather than read from the instance so PG_CONNECTION_NAME stays stable while Cloud SQL is disabled.
  sql_instance_name  = "main"
  pg_connection_name = "${var.project}:${var.region}:${local.sql_instance_name}"
  service_url        = "https://${local.service_name}-${data.google_project.main.number}.${var.region}.run.app"
}

locals {
  # Every environment variable the deployed app reads, mirrored into Secret Manager
  # under its own name. PG_HOST / PG_PORT are deliberately absent: they exist only
  # to point local development at docker-compose, and setting them in the deployed
  # environment would bypass the Cloud SQL connector.
  secret_names = ["JWT_SECRET", "PG_USER", "PG_PASS", "PG_NAME", "PG_CONNECTION_NAME", "URL", "GOOGLE_CLIENT_ID", "GOOGLE_AUTH_SECRET", "GITHUB_AUTH_SECRET", "GITHUB_CLIENT_ID"]

  secret_values = {
    JWT_SECRET         = var.jwt_secret
    PG_USER            = var.pg_user
    PG_PASS            = var.pg_pass
    PG_NAME            = var.pg_name
    PG_CONNECTION_NAME = local.pg_connection_name
    URL                = local.service_url
    GOOGLE_AUTH_SECRET = var.google_auth_secret
    GOOGLE_CLIENT_ID   = var.google_client_id
    GITHUB_AUTH_SECRET = var.github_auth_secret
    GITHUB_CLIENT_ID   = var.github_client_id
  }
}

resource "google_sql_database_instance" "main" {
  count               = var.enable_cloud_sql ? 1 : 0
  name                = local.sql_instance_name
  database_version    = "POSTGRES_18"
  region              = var.region
  deletion_protection = true
  settings {
    tier                        = "db-f1-micro"
    edition                     = "ENTERPRISE"
    disk_size                   = "10"
    deletion_protection_enabled = true
    retain_backups_on_delete    = true
    enable_dataplex_integration = true

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    final_backup_config {
      enabled        = true
      retention_days = 30
    }

    password_validation_policy {
      enable_password_policy      = true
      complexity                  = "COMPLEXITY_DEFAULT"
      disallow_username_substring = true
      min_length                  = 8
      reuse_interval              = 0
    }

    ip_configuration {
      ipv4_enabled = true
    }
  }
}

resource "google_sql_database" "main" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = var.pg_name
  instance = google_sql_database_instance.main[0].name
}

resource "google_sql_user" "main" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = var.pg_user
  instance = google_sql_database_instance.main[0].name
  password = var.pg_pass
}

resource "google_storage_bucket" "main" {
  name     = "chalkstudio-bucket"
  location = var.region
  cors {
    origin = ["*"]
    method = ["GET", "HEAD"]
  }
}

resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_secret_manager_secret" "main" {
  for_each  = toset(local.secret_names)
  secret_id = each.key
  replication {
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "main" {
  for_each    = google_secret_manager_secret.main
  secret      = each.value.id
  secret_data = local.secret_values[each.key]
}

resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudtasks" {
  service            = "cloudtasks.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iamcredentials" {
  service            = "iamcredentials.googleapis.com"
  disable_on_destroy = false
}

data "google_project" "main" {}

resource "google_artifact_registry_repository" "main" {
  repository_id = "chalkstudio"
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry]
}

resource "google_service_account" "app" {
  account_id   = "chalkstudio-app"
  display_name = "Chalk Studio application"
}

resource "google_service_account" "tasks_invoker" {
  account_id   = "chalkstudio-tasks-invoker"
  display_name = "Chalk Studio task dispatcher"
}

resource "google_cloud_tasks_queue" "email" {
  for_each = toset(["email-confirmation", "email-board-invitation"])
  name     = each.key
  location = var.region

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 20
  }

  retry_config {
    max_attempts       = 10
    min_backoff        = "5s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "3600s"
  }

  depends_on = [google_project_service.cloudtasks]
}

resource "google_cloud_tasks_queue" "reviews" {
  name     = "reviews"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 1
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts  = 3
    min_backoff   = "30s"
    max_backoff   = "600s"
    max_doublings = 2
  }

  depends_on = [google_project_service.cloudtasks]
}

output "pg_connection_name" {
  description = "Value for PG_CONNECTION_NAME in the app environment."
  value       = local.pg_connection_name
}

output "secret_ids" {
  description = "Secret Manager secrets holding the app environment, keyed by variable name."
  value       = { for name, secret in google_secret_manager_secret.main : name => secret.id }
}

output "service_url" {
  description = "Public address of the deployed app, and the OIDC audience task dispatches are signed for."
  value       = local.service_url
}

output "artifact_repository" {
  description = "Docker repository CI pushes the app image to."
  value       = "${var.region}-docker.pkg.dev/${var.project}/${google_artifact_registry_repository.main.repository_id}"
}
