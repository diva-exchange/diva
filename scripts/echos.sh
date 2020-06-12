#!/usr/bin/env bash

###
# some colorized echo helpers
# inspired from Adam Eivy
###

# Colors
ESC_SEQ="\x1b["
COL_RESET=$ESC_SEQ"39;49;00m"
COL_RED=$ESC_SEQ"31;01m"
COL_GREEN=$ESC_SEQ"32;01m"
COL_YELLOW=$ESC_SEQ"33;01m"
COL_BLUE=$ESC_SEQ"34;01m"
COL_MAGENTA=$ESC_SEQ"35;01m"
COL_CYAN=$ESC_SEQ"36;01m"

function ok() {
  echo -e "\n$COL_GREEN [ok] $COL_RESET "$1
}

function running() {
  echo -en "\n$COL_YELLOW ⇒ $COL_RESET "$1"…\n"
}

function bot() {
  echo -e "\n$COL_GREEN\[._.]/$COL_RESET - "$1
}

function action() {
  echo -e "\n$COL_YELLOW [action] $COL_RESET ⇒ "$1
}

function warn() {
  echo -e "\n$COL_YELLOW [warning] $COL_RESET "$1
}

function info() {
  echo -e "\n$COL_CYAN [info] $COL_RESET "$1
}

function error() {
  echo -e "\n$COL_RED [error] $COL_RESET "$1
}
