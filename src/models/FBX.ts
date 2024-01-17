import { defineComponent } from "vue";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { knownFolders, path, File } from "@nativescript/core";
import Model from "./Model";

export default defineComponent({
  extends: Model,
  created() {
    const loader = new FBXLoader();
    this.$emit("before-load", loader);

    const normalizedPath: string = path.normalize(
      knownFolders.currentApp().path + this.src.replace("~", "")
    );
    if (File.exists(normalizedPath)) {
      const file = File.fromPath(normalizedPath);
      file.read().then((contents) => {
        const uint8arr: Uint8Array = new Uint8Array(contents);
        try {
          const fbx = loader.parse(uint8arr.buffer, normalizedPath);
          this.onLoad(fbx);
          this.initObject3D(fbx);
        } catch (error) {
          this.onError(error);
        }
      });
    } else {
      loader.load(
        this.src,
        (fbx) => {
          this.onLoad(fbx);
          this.initObject3D(fbx);
        },
        this.onProgress,
        this.onError
      );
    }
  },
});
