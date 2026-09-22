#!/bin/sh
# Fetch the latest Unicode emoji list and CLDR Japanese annotations into data/.
set -eu
cd "$(dirname "$0")/.."
curl -fsSL -o data/emoji-test.txt https://unicode.org/Public/emoji/latest/emoji-test.txt
for f in annotations annotationsDerived; do
  curl -fsSL -o "data/$f-ja.xml" "https://raw.githubusercontent.com/unicode-org/cldr/main/common/$f/ja.xml"
done
