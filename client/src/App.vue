<template>
  <div class="app-container" :class="{ 'full-screen': isFullScreen }">
    <Transition name="fade" appear v-if="!isFullScreen"><Header /></Transition>
    <Transition name="fade" appear>
    <div class="main" :class="{ 'full-page': showFullPage }">
      <div class="page-body">
        <div class="container">
          <div class="loading-animation-overlay" v-if="isShowLoadingMessage">
            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            <div v-if="loadingMessageText" class="loading-message-text">{{ loadingMessageText }}</div>
          </div>
          <router-view v-slot="{ Component, route }">
            <Transition name="fade-faster" mode="out-in">
              <component :is="Component" :key="route.params.id || route.name"></component>
            </Transition> 
          </router-view>
        </div>
      </div>
    </div>
    </Transition>
  </div>
</template>

<script>
import Header from './components/infra/Header.vue';

import { mapGetters, mapActions, mapMutations } from 'vuex';
import messagesMixin from '@/mixins/messages.mixin';
import UserService from '@/services/UserService';
import CategoriesService from '@/services/CategoriesService';


export default {
  name: 'App',
  mixins: [messagesMixin],
  components: {
    Header
  },
  computed: {
    ...mapGetters(['messages', 'isShowLoadingMessage', 'loadingMessageText', 'isFullScreen']),
    showFullPage() {
      return this.$route.meta && this.$route.meta.fullPage;
    }
  },
  methods: {
    ...mapActions(['loginAndSaveUserIfHasToken', 'showLoadingMessage', 'hideLoadingMessage', 'addSuccessMessage', 'addErrorMessage']),
    ...mapMutations(['setIsGoogleAuthLoaded', 'setIsFullScreen']),
    showMessageIfNeeded() {
      let urlParams = new URLSearchParams(window.location.search);
      let message = urlParams.get('showMessage');

      if (message) {
        let type = urlParams.get('type');

        if (type == 'error') {
          this.addErrorMessage(message);
        } else if (type == 'success') {
          this.addSuccessMessage(message);
        } else {
          this.addInfoMessage(message);
        }

        this.$router.push({ name: this.$router.currentRoute.name });
      }
    },
    loadGoogleAuth() {
      
      var head = document.getElementsByTagName('head')[0];
      var js = document.createElement("script");

      js.type = "text/javascript";
      js.src = "https://accounts.google.com/gsi/client";
      head.appendChild(js);

      js.onload = () => {
          window.google.accounts.id.initialize({
            client_id: '838033830312-h0eii6g1pfrtccf1hi254fm1ha5gh3uo.apps.googleusercontent.com',
            context: "use",
            callback: async (cred) => {
              this.showLoadingMessage();

              try {
                let result = await UserService.loginWithGoogle(cred.credential);
                if (result.success) {
                  this.hideLoadingMessage();
                  this.addSuccessMessage("You have successfully logged in.");
                  this.$router.push('/');
                } else {
                  throw new Error(result);
                }
              } catch (err) {
                console.error(err);
                this.addErrorMessage("There was an error. Please try again. If the problem persists, please contact us.")
                this.hideLoadingMessage();
              }
              

              },
          });

        this.setIsGoogleAuthLoaded();
      };
    },
    checkAndUpdateFullScreen() {
      let isFullScreen = (window.fullScreen) ||
                         (window.innerHeight == screen.height);

      // not mobile
      isFullScreen = isFullScreen && !((window.innerWidth <= 800) && (window.innerHeight <= 600));

      this.setIsFullScreen(isFullScreen);
    }
  },
  mounted() {
    window.addEventListener('resize', this.checkAndUpdateFullScreen);
    this.checkAndUpdateFullScreen();

    Window.hideFirstLoader();
    this.showMessageIfNeeded();
    this.loginAndSaveUserIfHasToken().then(isLoggedIn => {
      if (isLoggedIn) {
        CategoriesService.loadCategories();
      } else {
        this.loadGoogleAuth();
      }
    }).catch(err => {
      console.info('Token expired', err);
      this.loadGoogleAuth();
    });
    
  },
  beforeUnmount() {
    document.removeEventListener("resize", this.checkFullScreen);
  },
}
</script>

<style>


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  max-width: 100%;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-container {
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-container.full-screen {
  grid-template-rows: 1fr;
}

.main {
  padding: 20px;
  text-align: center;
  display: grid;
  grid-template-columns: 100%;
}

.container {
  background-color: rgba(0, 0, 0, 1);
  border-radius: 20px;
  padding: 20px;
  display: inline-block;
  position: relative;
}

.loading-message-text {
  font-size: var(--title-text-size);
  font-weight: bold;
}

.main.full-page {
  padding: 0;
  overflow: hidden;
}

.main.full-page .page-body {
  display: flex;
  overflow: hidden;
}

.main.full-page .container {
  padding: 0;
  border-radius: 0;
  width: 100%;
  border-top: 2px solid white;
  display: flex;
}

.loading-animation-overlay {
  border-radius: 20px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.loading-animation-overlay > div {
  transform: scale(0.5);
}

.fade-enter-active,
.fade-leave-active
{
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-faster-enter-active
{
  transition: opacity 0.2s ease-in-out;
}

.fade-faster-leave-active {
  transition: opacity 0.1s ease-in-out;
}

.fade-faster-enter-from,
.fade-faster-leave-to {
  opacity: 0;
}

@media (max-width:480px)  {
  .main {
    grid-template-columns: 1fr;
  }

  .container {
    display: block;
  }

  .ads {
    display: none;
  }

  .input-size {
    width: 100%;
  }

  .el-form {
    width: 100%;
  }
}



</style>

