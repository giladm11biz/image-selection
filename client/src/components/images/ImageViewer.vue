<template>
    <div class="image-viewer">
      <div class="controls">
        <button @click="prevImage" :disabled="currentImageIndex == 0">Previous</button>
        <button @click="nextImage" :disabled="currentImageIndex >= imagesCache.length">Next</button>
        <button @click="zoomIn">Zoom In</button>
        <button @click="zoomOut">Zoom Out</button>
        <button @click="resetZoom">Reset Zoom</button>
        <button @click="deleteImage">Delete</button>
        <button @click="acceptImage">Accept</button>
        <button @click="undoAction">Undo</button>
      </div>
      <div class="image-container" ref="imageContainer">
        <div class="cropper-holder" v-if="currentImage">
          <cropper
        class="cropper"
        :src="currentImage.data"
        @change="updateData"
        image-restriction="none"
        :stencil-props="stencilProps"
        :stencil-size="stencilSize"
        :canvas="{
          imageSmoothingEnabled: false,
        }"
      ></cropper>
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
        zoomLevel: 100,
        imagesCache: [],
        imageViewerData: null,
        lockAction: Promise.resolve(),
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
        return {
            handlers: {},
            movable: false,
            resizable: false,
        }
      },
    },
    methods: {
      async setCurrentImageIndex(value) {
        if (this.imagesCache[value] && !this.imagesCache[value].isFinished) {
          this.showLoadingMessage("Loading image");
          await this.imagesCache[value].promise;
          await this.$nextTick();
          this.hideLoadingMessage();
        }

        this.currentImageIndex = value;
      },
      getCropperWidth() {
        return this.$refs.imageContainer.clientWidth;
      },
      getCropperHeight() {
        return this.$refs.imageContainer.clientHeight;
      },
      stencilSize({ boundaries }) {
        return {
          width: boundaries.width,
          height: boundaries.height,
        }
      },
      updateData(data) {
        this.zoomLevel = Math.round(data.image.transforms.scaleX * 100);
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
      }
    },
    mounted() {
      if (!this.isAuthenticating && !this.isAuthenticated) {
        this.$router.push('/login');
        return;
      }
      this.resetAndLoadFirstImage();
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
  