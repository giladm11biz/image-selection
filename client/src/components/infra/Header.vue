<template>
  <header class="header-footer">
      <div class="sidebar-menu-container" >
        <transition name="fade-faster">
        <div class="sidebar-overlay" @click="closeSidebar" v-if="isSidebarOpen"></div>
        </transition> 
        <transition name="slide-in">
        <div class="menu" v-if="isSidebarOpen">
          <div class="menu-header">
            <div class="menu-title">Menu</div>
            <div class="icon-button-border" @click="closeSidebar"><XMarkIcon /></div>
          </div>
          <div class="menu-links">
            <div v-if="showMenuLoadingMessage" class="menu-loading">Loading...</div>
            <div v-for="route in mobileRoutes" :key="route.path" class="menu-link"><router-link active-class="selected" :to="route.path" @click="closeSidebar">{{ route.text }}</router-link></div>
          </div>
          <div class="menu-links bottom">
            <div v-if="this.isAuthenticated" class="menu-links">
              <a href="#" @click.prevent="logout">Logout</a>
            </div>
          </div>
        </div>
        </transition>
      </div>
    <nav>
        <div class="hide-on-mobile hide-on-tablet">
          <div class="site-links links">
            <div v-if="showMenuLoadingMessage" class="menu-loading">Loading...</div>
            <div v-for="route in desktopRoutes" :key="route.path"><router-link active-class="selected" :to="route.path">{{ route.text }}</router-link></div>
          </div>
        </div>
        <div class="hide-on-desktop" @click="openSidebar">
          <div class="icon-button-border"><Bars3Icon /></div>
        </div>
        <div class="auth-links links">
          <div v-if="isAuthenticating" class="">Logging in...</div>
          <template v-else>
            <div v-if="!isAuthenticated"><router-link active-class="selected" to="/login">Log In</router-link></div>
            <div v-if="isAuthenticated">
              Hello, <router-link active-class="selected" to="/profile" class="underline">{{ userDisplayFirstName }}!</router-link>
              <span class="hide-on-mobile"> | </span>
              <a href="#" @click.prevent="logout" class="hide-on-mobile">Logout</a>
            </div>
          </template>
        </div>
    </nav>
  </header>
</template>

<script>
import UserService from '@/services/UserService';
import { mapGetters } from 'vuex'
import { ROUTES_BY_NAME } from '@/router/headerRouterConfig';
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline"


export default {
  name: 'Header',
  components: {
    Bars3Icon, XMarkIcon
  },
  data() {
    return {
      isSidebarOpen: false,
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'isAuthenticating', 'userDisplayFirstName', 'categories', 'showMenuLoadingMessage']),
    mobileRoutes() {
      let routes = this.categoriesRoutes;
      
      if (!this.isAuthenticated && !this.isAuthenticating) {
        routes = routes.concat([ROUTES_BY_NAME.login]);
      }

      return routes;
    },
    desktopRoutes() {
      return this.categoriesRoutes;
    },
    categoriesRoutes() {
      if (this.categories) {
        return this.categories.map(c => ({
          text: c.name,
          path: `/category/${c.id}`
        }));
      }

      return [];
    }
  },
  methods: {
    logout() {
      UserService.logout();
    },
    openSidebar() {
      this.isSidebarOpen = true;
    },
    closeSidebar() {
      this.isSidebarOpen = false;
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
   nav {
    display: grid;
    grid-template-columns: 1fr auto;
  }
  .links {
    display: flex;
  }
  .links > div {
    margin: 0 10px;
  }

  .auth-links {
    display: flex;
    align-items: center;
  }


  .sidebar-menu-container {
    width: 0;
    height: 0;
    z-index: -1;
  }
  .sidebar-overlay {
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100vh;
    height: 100dvh;
    position: absolute;
    z-index: 200;
    top: 0;
    left: 0;
  }

  .sidebar-menu-container .menu {
    z-index: 201;
    min-width: 50%;
    height: 100vh;
    height: 100dvh;
    background-color: black;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
  }

  .sidebar-menu-container .menu .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid white;
    padding: 10px 0;
  }

  .sidebar-menu-container .menu .menu-header .menu-title {
    font-size: var(--title-text-size);
    font-weight: bold;
  }

  .sidebar-menu-container .menu .menu-header .close-button {
    cursor: pointer;
  }


  .sidebar-menu-container .menu .menu-links {
    font-weight: bold;
    font-size: var(--menu-item-text-size);
    padding: 10px 0;
  }


  .sidebar-menu-container .menu .menu-links .menu-link {
    display: flex;
    padding: 0.4em 0;
  }


  .sidebar-menu-container .menu .menu-links a {
    width: 100%
  }


  .sidebar-menu-container .menu .menu-links.bottom {
    flex: 1;
    display: flex;
    align-items: flex-end;
  }

.slide-in-enter-active,
.slide-in-leave-active
{
  transition: transform 0.2s ease-in-out;
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(-100%);
}

</style>

