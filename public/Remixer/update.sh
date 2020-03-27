#!/usr/bin/env bash
pwd
sed -i "s/REPLACEWITHDATE/$(date -Iseconds)/g" bundle.js
exit