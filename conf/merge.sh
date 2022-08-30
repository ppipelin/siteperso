#!/bin/bash

git fetch --all
git reset --hard origin/main
git submodule	update --init --recursive
