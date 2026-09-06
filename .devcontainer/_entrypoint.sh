#!/bin/bash
set -e

# Assert that .devcontainer generated files are still compatible with run-time version
~/.local/bin/assert_saicli_version.sh "2026-09-06_23:51"

# Cleanup state from previous container run
rm -f ui/.astro/dev.json

# If using copilot
# ~/.copilot/config_backup_restore_auth.py

herdr_spreader.py --file .devcontainer/herdr_start_config.yaml --file ~/.local/share/herdr_common.yaml
# user can only detach, so we stop herdr here
herdr server stop

# In case we exit tmux
# exec bash -l
