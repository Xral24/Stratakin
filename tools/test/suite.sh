#!/bin/bash
# the whole-game smoke run: every story system, one after another, one browser at a time
cd /home/claude/strata-test; out=/home/claude/scratch/suite.txt; : > $out
[ $# -eq 0 ] && set -- first scene gang part doors film films2 films3 cine fields2 market cart bank lab keep cit atlplay elder camps rail bal net ruins hold
for t in "$@"; do pkill -f chrom 2>/dev/null; sleep 1; s=$(date +%s); timeout $([ "$t" = atlplay ] && echo 300 || echo 115) node t-$t.js > /home/claude/scratch/suite-$t.log 2>&1; rc=$?
  if grep -q "errors \[\]\|ERRORS: none" /home/claude/scratch/suite-$t.log && ! grep -q "triggerUncaughtException\|ERR " /home/claude/scratch/suite-$t.log; then r=PASS; else r="FAIL(rc=$rc)"; fi
  echo "$t $r $(( $(date +%s) - s ))s" >> $out; done; echo DONE >> $out
