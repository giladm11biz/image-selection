<template>
  <div class="image-viewer">
    <div class="controls" v-if="!isFullScreen">
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
        :transition-time="0"
        :canvas="{
          imageSmoothingEnabled: false,
        }"></cropper>
      </div>

      <div v-else>No image loaded</div>
    </div>
    <div class="status-bar">
      <div class="zoom-level">{{ zoomLevel }}%</div>
      <div class="image-name">
        <el-tooltip
          class="box-item"
          :content="currentImage.fileName"
          placement="bottom"
          v-if="currentImage">
        {{ currentImage.fileName }}
        </el-tooltip>
      </div>
      <div class="not-saved-actions">{{ this.unfinishedActionsCount ? 'Saving ' + this.unfinishedActionsCount + ' changes...' : '' }}</div>
    </div>
    <div class="hot-keys" v-if="showHotKeys">
      <table style="width: 100%">
        <tr>
          <th>Key</th>
          <th>Action</th>
        </tr>
        <tr>
          <td>&larr;</td>
          <td>Previous image</td>
        </tr>
        <tr>
          <td>&rarr;</td>
          <td>Next image</td>
        </tr>
        <tr>
          <td>+|7</td>
          <td>Zoom In</td>
        </tr>
        <tr>
          <td>-|9</td>
          <td>Zoom Out</td>
        </tr>
        <tr>
          <td>=|8|R</td>
          <td>Reset Zoom</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Delete</td>
        </tr>
        <tr>
          <td>1</td>
          <td>Accept</td>
        </tr>
        <tr>
          <td>0|CTRL+Z</td>
          <td>Undo</td>
        </tr>
        <tr>
          <td>C|4</td>
          <td>Enter Crop Mode / Cancel Crop</td>
        </tr>
        <tr>
          <td>V|5</td>
          <td>Finish Crop And Save (In Crop Mode) / Crop Current View (Outside Crop Mode)</td>
        </tr>
        <tr>
          <td>H</td>
          <td>Show / Close Hot Keys Help</td>
        </tr>
      </table>
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
      transforms: null,
      cropMode: false,
      updatedZoomLevel: null,
      isEndReached: false,
      notSavedActions: {},
      showHotKeys: false,
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'isAuthenticating', 'isFullScreen']),
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
    },
    unfinishedActionsCount() {
      return Object.keys(this.notSavedActions).length;
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
      // 4 = 52 or Numpad 4 = 100 or 'c'
      else if ([52,100,67].includes(e.keyCode)) {
        if (this.cropMode) {
          this.cancelCroping();
        } else {
          this.startCroping();
        }
      }
      // 5 = 53 or Numpad 5 = 101 or 'v'
      else if ([53,101, 86].includes(e.keyCode)) {
        if (!this.cropMode) {
          this.startCroping();
        }

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
      // ctrl+z or 0 
      else if ([96,48].includes(e.keyCode) || (e.keyCode == 90 && e.ctrlKey)) {
        this.undoAction();
      }
      // H 
      else if (e.keyCode === 72) {
        this.showHotKeys = !this.showHotKeys;
      }
      // 1 
      else if ([49,97].includes(e.keyCode)) {
        this.acceptImage();
      }
      // 2
      else if ([50,98].includes(e.keyCode)) {
        this.deleteImage();
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

      await this.doActionAndAddToUnsavedActions(async () => {
        let cropData = this.$refs.cropper.getResult();

        this.showLoadingMessage("Cropping image");
        try {
          let dataToSend = {
            width: Math.round(cropData.coordinates.width),
            height: Math.round(cropData.coordinates.height),
            left: Math.round(cropData.coordinates.left),
            top: Math.round(cropData.coordinates.top)
          };

          if (dataToSend.top < 0) {
            dataToSend.height += dataToSend.top;
            dataToSend.top = 0;
          }

          if (dataToSend.left < 0) {
            dataToSend.width += dataToSend.left;
            dataToSend.left = 0;
          }
          
          const response = await axios.post(`/api/categories/${this.categoryId}/${this.currentImage.fileName}/crop`, dataToSend);

          if (response.status == 204 || response.data == null || response.data == '' || response.data.url == '') {
            return null;
          }

          this.imagesCache[this.currentImageIndex].image = response.data;
          this.imagesCache[this.currentImageIndex].promise = Promise.resolve(response.data);
        } catch (error) {
          this.addErrorMessage('Error cropping image(' + this.currentImage.fileName +')');
          console.error('Error cropping image:', this.currentImage.fileName, error);
        }

        this.cancelCroping();
        this.hideLoadingMessage();
      })
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
      if (this.imagesCache.length < IMAGES_TO_PRELOAD && !this.isEndReached) {
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
      if (image == null) {
        this.isEndReached = true;
        const index = this.imagesCache.findIndex(item => item.uuid === uuid);
        if (index !== -1) {
          this.imagesCache.splice(index, 1);
        }
      } else {
        let cacheData = this.imagesCache.find(image => image.uuid == uuid);

        if (cacheData) {
          cacheData.isFinished = true;
          cacheData.image = image;
        }
      } 

    },
    async doActionAndAddToUnsavedActions(action) {
      let uuid = (new Date()).valueOf();
      this.notSavedActions[uuid] = true;
      let result = await action();
      delete this.notSavedActions[uuid];
      return result;
    },
    async doActionOnlyIfNoActionsInProgress(action) {
      if (this.unfinishedActionsCount > 0) {
        this.addErrorMessage("There are some changes that wasn't save yet, please try again later.");
        return;
      }
      return await this.doActionAndAddToUnsavedActions(action);
    },
    // async doAndLockCache(action) {
    //   await this.lockAction;
    //   this.lockAction = new Promise(resolve => {
    //     await action();
    //     resolve();
    //   });
    // },

    async deleteImage() {
      this.acceptOrDeleteImage(false);
    },
    async acceptImage() {
      await this.acceptOrDeleteImage(true);
    },
    async acceptOrDeleteImage(isAccept) {
      let image = this.currentImage;
      this.imagesCache.splice(this.currentImageIndex, 1);
      this.setCurrentImageIndex(this.currentImageIndex);
      this.loadMoreImagesIfNeeded();

      await this.doActionAndAddToUnsavedActions(async () => {
        try {
          let action = isAccept ? 
          () => axios.post(`/api/categories/${this.categoryId}/${image.fileName}/accept`) :
          () => axios.delete(`/api/categories/${this.categoryId}/${image.fileName}`);
          await action();
        } catch (error) {
          const text = isAccept ? 'accepting' : 'deleting';
          this.addErrorMessage('Error ' + text +' image(' + this.currentImage.fileName +'). Please refresh page to get the latest data');
          console.error('Error ' + text +' image:', this.currentImage.fileName, error);
        }
      })
    },
    async undoAction() {
      return await this.doActionOnlyIfNoActionsInProgress(async () => {
          this.showLoadingMessage("Undoing last action");
        try {
          const response = await axios.post(`/api/categories/${this.categoryId}/undo`);

          if (response.status == 204 || response.data == null || response.data == "") {
            this.hideLoadingMessage();
            this.addWarningMessage('No action to undo');
            return;
          }

          let imageIndex = this.imagesCache.findIndex(imageCache => imageCache.image.fileName == response.data.fileName);

          if (imageIndex == -1) {
            this.imagesCache.unshift({
              uuid: (new Date()).valueOf(),
              isFinished: true,
              promise: Promise.resolve(response.data),
              image: response.data,
            });

            this.setCurrentImageIndex(0);
          } else {
            this.imagesCache[imageIndex].image = response.data;
            this.imagesCache[imageIndex].promise = Promise.resolve(response.data);
            this.setCurrentImageIndex(imageIndex);
          }

          this.imagesCache[this.currentImageIndex].image = response.data;
        } catch (error) {
          this.addErrorMessage('Error undoing action');
          console.error('Error undoing action', error);
        }

        this.hideLoadingMessage();

      });
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
    document.addEventListener('keyup', this.setHotkeys);
  },
  beforeUnmount() {
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

 .cropper-holder > div {
  height: 100%;
 }

.status-bar {
  display: flex;
  justify-content: space-between;
  border-top: 2px solid white;
  padding: 0px 10px;
}

.status-bar > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.status-bar .zoom-level {
  text-align: left;
}

.status-bar .not-saved-actions {
  text-align: right;
}

.controls button {
  margin: 0 5px;
}

.hot-keys {
  padding: 5px;
  position: absolute;
  z-index: 100;
  background: rgba(0, 0, 0, 0.9);
  left: 50%;
  transform: translateX(-50%);
  border-radius: 20px;
  padding: 30px;
  width: 75%;
}

.hot-keys td {
  border-bottom: 1px dotted white;
  padding: 5px;
}

.controls {
  border-bottom: 2px solid white;
  padding: 5px;
}
</style>
