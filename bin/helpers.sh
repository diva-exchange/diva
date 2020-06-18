#!/usr/bin/env bash

function command_exists () {
  type hash "$1" 2>/dev/null;
}
