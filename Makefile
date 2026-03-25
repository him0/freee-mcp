# image_assembly_line compatible targets (for CI compatibility)
# The CI action runs `make <target> IMAGE_NAME=<name> REGISTRY_NAME=<registry>`
# with VERSION_TAG available as an environment variable.
.PHONY: .

.:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile .
