.PHONY: build\:main build\:sign

build\:main:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile .

build\:sign:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile.sign .
