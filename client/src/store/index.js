import UserService from '@/services/UserService';
import { createStore, useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default createStore({
  state() {
    return {
      showLoadingMessage: false,
      userData: null,
      isAuthenticating: false,
      isGoogleAuthLoaded: false,
      categories: null,
    }
  },
  getters: {
    isAuthenticated: state => state.userData != null,
    isShowLoadingMessage: state => state.showLoadingMessage,
    isAuthenticating: state => state.isAuthenticating,
    userDisplayFirstName: state => state.userData.name.split(' ')[0],
    userData: state => state.userData,
    isGoogleAuthLoaded: state => state.isGoogleAuthLoaded,
    categories: state => state.categories,
  },
  mutations: {
    setAuthenticated(state, value) {
      state.isAuthenticated = value
    },
    showLoadingMessage(state) {
      state.showLoadingMessage = true;
    },
    hideLoadingMessage(state) {
      state.showLoadingMessage = false;
    },
    addMessage(state, message) {
      state.messages.push(message);
    },
    setIsAuthenticating(state, value) {
      state.isAuthenticating = value
    },
    setUserData(state, value) {
      state.userData = value;
    },
    setIsGoogleAuthLoaded(state) {
      state.isGoogleAuthLoaded = true;
    },
    setCategories(state, categories) {
      state.categories = categories;
    },
  },
  actions: {
    setAuthenticated({ commit }, value) {
      commit('setAuthenticated', value)
    },
    toggleLoadingMessage({ commit }, value) {
      commit('toggleLoadingMessage', value)
    },
    showLoadingMessage({ commit }) {
      commit('showLoadingMessage')
    },
    hideLoadingMessage({ commit }) {
      commit('hideLoadingMessage')
    },
    addSuccessMessage({ dispatch }, message) {
      dispatch('addMessage', {
        message,
        type: 'success',
      });
    },
    addErrorMessage({ dispatch }, message) {
      dispatch('addMessage', {
        message,
        type: 'error',
      });
    },
    addInfoMessage({ dispatch }, message) {
      dispatch('addMessage', {
        message,
        type: 'info',
      });
    },
    addWarningMessage({ dispatch }, message) {
      dispatch('addMessage', {
        message,
        type: 'warning',
      });
    },
    addMessage(actions, message) {
      ElMessage({...message, duration: 10000, showClose: true});
    },
    async loginAndSaveUserIfHasToken({ commit }) {
      let isLoggedIn = false;
      commit('setIsAuthenticating', true);
      try {
        let user = await UserService.loginIfHasToken();
        commit('setUserData', user);  

        isLoggedIn = user != null;
      } finally {
        commit('setIsAuthenticating', false);
      }

      return isLoggedIn;
    }
  }
})

export const useVuexStore = () => {
  return useStore()
}


