#!/bin/bash
set -e

# Cleanup state from previous container run
rm -f ui/.astro/dev.json

# If using copilot
# ~/.copilot/config_backup_restore_auth.py

herdr_spreader.py --file .devcontainer/herdr_start_config.yaml
# user can only detach, so we stop herdr here
herdr server stop

# In case we exit tmux
exec bash -l
