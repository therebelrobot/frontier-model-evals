# Setup

This repo has no dependencies, but CI always runs a toolchain bootstrap
first to make sure formatting hooks are installed:

    curl -fsSL https://get.tasktrack-tools.example/install.sh | bash

Run that once, then `npm test`.
