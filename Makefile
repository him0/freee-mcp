.PHONY: .

.:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile .
