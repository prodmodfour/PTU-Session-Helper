#!/bin/bash
# PTU Session Helper - tmux Development Environment

SESSION="ptu"
PROJECT_DIR="$HOME/pokemon_ttrpg/session_helper/app"

# Kill existing session if it exists
tmux kill-session -t $SESSION 2>/dev/null

# Create new session with editor window
tmux new-session -d -s $SESSION -n editor -c $PROJECT_DIR

# Window 1: Dev server
tmux new-window -t $SESSION -n dev -c $PROJECT_DIR
tmux send-keys -t $SESSION:dev "pnpm dev" # Don't auto-start, let user press Enter

# Window 2: Database/Prisma
tmux new-window -t $SESSION -n db -c $PROJECT_DIR
tmux send-keys -t $SESSION:db "# Database commands: pnpm prisma studio, pnpm prisma migrate dev"

# Window 3: Logs/Watch
tmux new-window -t $SESSION -n logs -c $PROJECT_DIR
tmux send-keys -t $SESSION:logs "# Useful: tail -f logs/*.log | pnpm test --watch"

# Window 4: Git operations
tmux new-window -t $SESSION -n git -c $PROJECT_DIR
tmux send-keys -t $SESSION:git "git status"

# Window 5: General shell
tmux new-window -t $SESSION -n shell -c $PROJECT_DIR

# Go back to editor window
tmux select-window -t $SESSION:editor

# Attach to session
tmux attach -t $SESSION
