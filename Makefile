# image_assembly_line が target: . で呼び出すためデフォルトターゲット名を維持
.PHONY: . build\:sign

.:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile .

build\:sign:
	docker build -t $(IMAGE_NAME):$(VERSION_TAG) -f Dockerfile.sign .
