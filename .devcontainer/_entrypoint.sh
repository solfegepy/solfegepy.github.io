#!/bin/bash
set -e

entry_checks.py \
  --saicli-version "2026-10-29_13:48" \
  --ui-dir ./ui

herdr_spreader.py \
  --file .devcontainer/herdr_start_config.yaml \
  --file ~/.local/share/herdr_common.yaml

# user can only detach, so we stop herdr here
herdr server stop

# In case we exit tmux
# exec bash -l
