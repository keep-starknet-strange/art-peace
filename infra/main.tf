terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

locals {
  project = "exploration-dev-417917"
  region  = "us-central1"
  zone    = "us-central1-a"
}

provider "google" {
  project = local.project
}

resource "google_service_account" "art-peace-net" {
  account_id   = "art-peace-net-account"
  display_name = "art-peace-net"
}

resource "google_compute_network" "art-peace-net" {
  name = "art-peace-net"
}
