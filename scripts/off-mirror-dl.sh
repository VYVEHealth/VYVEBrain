#!/bin/bash
# VYVE — resumable pull of the Open Food Facts Parquet export (PM-1063, §23.235).
# Lives at /srv/vyve/off/dl.sh on the Hetzner box. Aborts when under 200 KB/s for 30 s and resumes from the byte offset.
cd /srv/vyve/off
for i in $(seq 1 40); do
  curl -sL -C - --speed-time 30 --speed-limit 200000 -o food.parquet.part "https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet" && { mv food.parquet.part food.parquet; echo DONE; exit 0; }
  echo "retry $i rc=$?"; sleep 5
done
