provider "google" {
  project = "chalkstudio-508318"
  region  = "europe-central2"
}

import {
  to = google_sql_database_instance.main
  id = "projects/chalkstudio-508318/instances/main"
}

resource "google_sql_database_instance" "main" {
  name             = "main"
  database_version = "POSTGRES_18"
  region           = "europe-central2"
  deletion_protection = true
  lifecycle {
    ignore_changes = [settings[0].maintenance_window]
  }
  settings {
    tier              = "db-g1-small"
    availability_type = "ZONAL"
    disk_size         = "10"
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

resource "google_storage_bucket" "main" {
  name     = "chalkstudio-bucket"
  location = "europe-central2"
}
