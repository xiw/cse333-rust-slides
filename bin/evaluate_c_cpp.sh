#!/bin/sh

set -o errexit

g++ -x c++ -std=c++11 - -o out
printf '\377' # 255 in octal
./out
