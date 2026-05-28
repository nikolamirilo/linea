#!/bin/bash

set -e  # stop on error

# Default environment
ENVIRONMENT="development"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --production)
      ENVIRONMENT="production"
      ;;
    --staging)
      ENVIRONMENT="staging"
      ;;
    --development)
      ENVIRONMENT="development"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--development|--staging|--production]"
      exit 1
      ;;
  esac
done

echo "Target environment: $ENVIRONMENT"

echo "Uninstalling app..."
forge uninstall -e "$ENVIRONMENT" --site reactify-solutions.atlassian.net --product confluence

echo "Deploying app..."
forge deploy -e "$ENVIRONMENT"

echo "Installing app..."
forge install -e "$ENVIRONMENT" --site reactify-solutions.atlassian.net --product confluence

echo "Done ✅"