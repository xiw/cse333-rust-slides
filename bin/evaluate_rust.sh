#!/bin/sh

set -o errexit

rustc - -C opt-level=$1 -o out -A dead_code -A unused_variables -A unused_mut
printf '\377' # 255 in octal
./out
