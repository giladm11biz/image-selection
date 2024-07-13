<template>
  <div class="image-viewer">
    <div class="controls">
      <button @click="prevImage" :disabled="currentImageIndex == 0">Previous</button>
      <button @click="nextImage" :disabled="currentImageIndex == imagesCache.length - 1">Next</button>
      <button @click="zoomIn">Zoom In</button>
      <button @click="zoomOut">Zoom Out</button>
      <button @click="resetZoom">Reset Zoom</button>
      <button @click="deleteImage">Delete</button>
      <button @click="acceptImage">Accept</button>
      <button @click="undoAction">Undo</button>
      <button @click="startCroping" v-if="!cropMode">Crop</button>
      <button @click="finishCroping" v-if="cropMode">Apply</button>
      <button @click="cancelCroping" v-if="cropMode">Cancel</button>

    </div>
    <div class="image-container" ref="imageContainer">
      <div class="cropper-holder" v-if="currentImage">
        <cropper
        class="cropper"
        ref="cropper"
        :src="currentImage.data"
        @change="updateData"
        image-restriction="none"
        :autoZoomAlgorithm="autoZoomAlgorithm"
        :stencil-props="stencilProps"
        :transitions="false"
        :transition-time="100"
        :canvas="{
          imageSmoothingEnabled: false,
        }"></cropper>
      </div>

      <div v-else>No image loaded</div>
    </div>
    <div class="status-bar">
      <p>{{ zoomLevel }}%</p>
      <p v-if="currentImage">{{ currentImage.name }}</p>
    </div>
  </div>
</template>

<script>
import messagesMixin from '@/mixins/messages.mixin';
import axios from 'axios';
import { mapGetters } from 'vuex';
import { Cropper } from 'vue-advanced-cropper'
const IMAGES_TO_PRELOAD = 10;


export default {
  mixins: [messagesMixin],
  components: { Cropper },
  data() {
    return {
      currentImageIndex: null,
      imagesCache: [],
      imageViewerData: null,
      lockAction: Promise.resolve(),
      transforms: null,
      cropMode: false,
      updatedZoomLevel: null,
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'isAuthenticating']),
    categoryId() {
      return this.$route.params.id;
    },
    currentImage() {
      if (!this.imagesCache[this.currentImageIndex]) {
        return null;
      }

      if (!this.imagesCache[this.currentImageIndex].isFinished) {
        return null;
      }
      
      return this.imagesCache[this.currentImageIndex].image;
    },
    stencilProps() {
      if (this.cropMode) {
        return {
          handlers: {},
          movable: true,
          resizable: true,
        }
      }

      return {
          handlers: {},
          movable: false,
          resizable: false,
      }
    },
    zoomLevel() {
      return this.transforms ? Math.round(this.currentZoomScale * 100) : 0;
    },
    currentZoomScale() {
      return this.transforms ? this.updatedZoomLevel || this.transforms.scaleX : 0;
    }
  },
  methods: {
    autoZoomAlgorithm(params) {
      if (this.cropMode) {
        return {visibleArea: params.visibleArea, coordinates: params.coordinates};
      }

      return {visibleArea: params.visibleArea, coordinates: params.visibleArea};
    },
    setHotkeys(e) {
      console.log(e);

      // ArrowLeft = 37 
      if (e.keyCode === 37) {
        this.prevImage();
      } 
      // ArrowRight = 39
      else if (e.keyCode === 39) {
        this.nextImage();
      } 
      // 4 = 52 or Numpad 4 = 100
      else if ([52,67,100].includes(e.keyCode)) {
        this.startCroping();
      } 
      // 5 = 53 or Numpad 5 = 101
      else if ([53,101].includes(e.keyCode)) {
        this.finishCroping();
      } 
      // 6 = 54 or Numpad 6 = 102
      else if ([54,102].includes(e.keyCode)) {
          this.cancelCroping();
      }
      // r or 8 or Numpad 8 = 104
      else if ([56,104,187,82].includes(e.keyCode)) {
        this.resetZoom();
      }
      // - or 9 or Numpad 9 = 105
      else if ([57,105,189].includes(e.keyCode)) {
        this.zoomOut();
      }
      // + or 7 or Numpad Add = 107
      else if ([103,55,107,171].includes(e.keyCode)) {
        this.zoomIn();
      }
    },
    zoomIn() {
      this.setZoom(1.1);
    },
    zoomOut() {
      this.setZoom(0.9);
    },
    resetZoom() {
      this.setZoom(1 / this.currentZoomScale);
    },
    setZoom(zoom) {
      this.updatedZoomLevel = this.currentZoomScale * zoom;
      this.$refs.cropper.zoom(zoom);
    },
    startCroping() {
      if (this.cropMode) {
        return;
      }

      this.cropMode = true;
    },
    async finishCroping() {
      if(!this.cropMode) {
        return;
      }

      let cropData = this.$refs.cropper.getResult();

      this.showLoadingMessage("Cropping image");
      try {
        const response = await axios.post(`/api/categories/${this.categoryId}/${this.currentImage.fileName}/crop`, {
          width: Math.round(cropData.coordinates.width),
          height: Math.round(cropData.coordinates.height),
          left: Math.round(cropData.coordinates.left),
          top: Math.round(cropData.coordinates.top)
        });

        if (response.status == 204 || response.data == null || response.data.url == '') {
          return null;
        }

        this.imagesCache[this.currentImageIndex].image = response.data;
      } catch (error) {
        this.addErrorMessage('Error cropping image(' + this.currentImage.fileName +')');
        console.error('Error cropping image:', this.currentImage.fileName, error);
      }

      this.hideLoadingMessage();

      this.cancelCroping();
    },
    cancelCroping() {
      if(!this.cropMode) {
        return;
      }

      this.cropMode = false;
      this.$refs.cropper.refresh();
    },
    async setCurrentImageIndex(value) {
      if (this.imagesCache[value] && !this.imagesCache[value].isFinished) {
        this.showLoadingMessage("Loading image");
        await this.imagesCache[value].promise;
        await this.$nextTick();
        this.hideLoadingMessage();
      }

      this.currentImageIndex = value;
    },
    // stencilSize(data) {
    //   return {
    //     width: this.$refs.imageContainer.clientWidth * (1 / this.currentZoomScale),
    //     height: this.$refs.imageContainer.clientHeight  * (1 / this.currentZoomScale),
    //   }
    // },
    updateData(data) {
      this.transforms = data.image.transforms;
      this.updatedZoomLevel = null;
    },
    async resetAndLoadFirstImage() {
      if (!this.isAuthenticated) {
        this.showLoadingMessage("Logging in");
        return;
      }

      await this.$nextTick();
      this.showLoadingMessage("Loading images");
      this.imagesCache = [];
      
      try {
        await this.startLoadingImages(1, 0);
        this.hideLoadingMessage();
        await this.setCurrentImageIndex(0);
        await this.loadMoreImagesIfNeeded();
      } catch (err) {
        console.error(err);
        this.addErrorMessage("There was an error. Please try again. If the problem persists, please contact us.");
        this.hideLoadingMessage();
      }
    },
    async loadImage(index) {
      try {
        const response = await axios.get(`/api/categories/${this.categoryId}/${index}`);

        if (response.status == 204 || response.data == null || response.data.url == '') {
          return null;
        }

        return response.data;
      } catch (error) {
        this.addErrorMessage('Error loading image(index:' + index +')');
        console.error('Error loading image:', error);
        return null;
      }
    },
    async loadMoreImagesIfNeeded() {
      if (this.imagesCache.length < IMAGES_TO_PRELOAD) {
        let number_of_images = IMAGES_TO_PRELOAD - this.imagesCache.length;
        await this.startLoadingImages(number_of_images, this.imagesCache.length);
      }
    },
    async startLoadingImages(numberOfImages = 1, startIndex = 0) {
      for (let i = 0; i < numberOfImages; i++) {
        let uuid = (new Date()).valueOf();
        this.imagesCache.push({
          uuid: uuid,
          isFinished: false,
          promise: this.loadImage(i + startIndex).then(result => this.handleImageLoaded(uuid, result)),
          image: null,
        }
        )
      }

      return await Promise.all(this.imagesCache.map(image => image.promise));
    },
    async handleImageLoaded(uuid, image) {
      // await this.doAndLockCache(async () => {
        let cacheData = this.imagesCache.find(image => image.uuid == uuid);

        if (cacheData) {
          cacheData.isFinished = true;
          cacheData.image = image;
        }
      // })
    },
    // async doAndLockCache(action) {
    //   await this.lockAction;
    //   this.lockAction = new Promise(resolve => {
    //     await action();
    //     resolve();
    //   });
    // },

    async deleteImage() {
      const imageName = this.currentImageName;
      await axios.delete(`/api/categories/${this.categoryId}/${imageName}`);
      this.undoStack.push({ action: 'delete', image: imageName });
      await this.updateImageCount();
      if (this.currentImageIndex >= this.imageCount) {
        this.currentImageIndex = this.imageCount - 1;
      }
      await this.loadImage(this.currentImageIndex);
    },
    async acceptImage() {
      const imageName = this.currentImageName;
      await axios.post(`/api/categories/${this.categoryId}/${imageName}/accept`);
      this.undoStack.push({ action: 'accept', image: imageName });
      await this.updateImageCount();
      if (this.currentImageIndex >= this.imageCount) {
        this.currentImageIndex = this.imageCount - 1;
      }
      await this.loadImage(this.currentImageIndex);
    },
    async undoAction() {
      const lastAction = this.undoStack.pop();
      if (lastAction) {
        await axios.post(`/api/categories/${this.categoryId}/undo`);
        await this.updateImageCount();
        await this.loadImage(this.currentImageIndex);
      }
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.setCurrentImageIndex(this.currentImageIndex - 1);
      }
    },
    nextImage() {
      if (this.currentImageIndex < this.imagesCache.length - 1) {
        this.setCurrentImageIndex(this.currentImageIndex + 1);
      }
    },
    async updateImageCount() {
      try {
        const response = await axios.get(`/api/categories/${this.categoryId}`);
        this.imageCount = response.data.length;
      } catch (error) {
        console.error('Error fetching image count:', error);
      }
    },
  },
  mounted() {
    if (!this.isAuthenticating && !this.isAuthenticated) {
      this.$router.push('/login');
      return;
    }
    this.resetAndLoadFirstImage();
    console.log('addkeys');
    document.addEventListener('keyup', this.setHotkeys);
  },
  beforeUnmount() {
    console.log('remove keys');
    document.removeEventListener('keyup', this.setHotkeys);
  },
  watch: {
    categoryId() {
      this.resetAndLoadFirstImage();
    },
    isAuthenticated() {
      this.resetAndLoadFirstImage();
    },
    isAuthenticating(newVal) {
      if(!newVal) {
        if (!this.isAuthenticated) {
          this.hideLoadingMessage();
          this.$router.push('/login');
        }
      }
    }
  }
};
</script>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.image-container {
  overflow: hidden;
  text-align: center;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.cropper-holder {
  overflow: hidden;
  height: 100%;
  width: 100%;
 }

.status-bar {
  display: flex;
  justify-content: space-between;
  border-top: 2px solid white;
  padding: 0px 10px;
  line-height: 0;
}
.controls button {
  margin: 0 5px;
}

.controls {
  border-bottom: 2px solid white;
  padding: 5px;
}
</style>
