import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import store from './store'
import router from './router'
import axios from 'axios'
import 'vue-advanced-cropper/dist/style.css';




if (window.location.hostname === 'localhost') {
    axios.defaults.baseURL = 'http://localhost:3000';
}

if (window.location.hostname === '10.0.0.22') {
    axios.defaults.baseURL = 'http://10.0.0.22:3000';
}

createApp(App).use(router).use(store).use(ElementPlus).mount('#app');
