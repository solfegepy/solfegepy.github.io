#!/bin/bash
set -e

# Cleanup state from previous container run
rm -f ui/.astro/dev.json

tmux new-session \; \
  send-keys 'codex' \; \
  split-window -v \; \
  send-keys 'codex -p high' \; \
  split-window -v \; \
  send-keys 'm start-dev' C-m \; \
  select-pane -t 1

# In case we exit tmux
exec bash -l
