#!/bin/bash
set -e

# Cleanup state from previous container run
rm -f ui/.astro/dev.json

# If using copilot
~/.copilot/config_backup_restore_auth.py

tmux new-session \; \
  send-keys 'copilot' \; \
  split-window -v \; \
  send-keys 'm start-dev' C-m \; \
  select-pane -t 1
  # split-window -v \; \
  # send-keys 'm start-ui-dev' C-m \; \
  # split-window -h \; \
  # send-keys 'm start-api-dev' C-m \; \


# In case we exit tmux
# exec bash -l
