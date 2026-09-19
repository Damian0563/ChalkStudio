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

locals {
  # Every environment variable the deployed app reads, mirrored into Secret Manager
  # under its own name. PG_HOST / PG_PORT are deliberately absent: they exist only
  # to point local development at docker-compose, and setting them in the deployed
  # environment would bypass the Cloud SQL connector.
  secret_names = ["JWT_SECRET", "PG_USER", "PG_PASS", "PG_NAME", "PG_CONNECTION_NAME"]

  secret_values = {
    JWT_SECRET         = var.jwt_secret
    PG_USER            = var.pg_user
    PG_PASS            = var.pg_pass
    PG_NAME            = var.pg_name
    PG_CONNECTION_NAME = google_sql_database_instance.main.connection_name
  }
}

resource "google_sql_database_instance" "main" {
  name                = "main"
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
  name     = var.pg_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = var.pg_user
  instance = google_sql_database_instance.main.name
  password = var.pg_pass
}

resource "google_storage_bucket" "main" {
  name     = "chalkstudio-bucket"
  location = var.region
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

output "pg_connection_name" {
  description = "Value for PG_CONNECTION_NAME in the app environment."
  value       = google_sql_database_instance.main.connection_name
}

output "secret_ids" {
  description = "Secret Manager secrets holding the app environment, keyed by variable name."
  value       = { for name, secret in google_secret_manager_secret.main : name => secret.id }
}
