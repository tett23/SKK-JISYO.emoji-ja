.PHONY: all fetch extract build

all: build

fetch:
	./scripts/fetch.sh

extract:
	python3 scripts/extract.py

build:
	python3 scripts/build.py
