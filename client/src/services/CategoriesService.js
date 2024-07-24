import store from "@/store";
import axios from "axios";
import SocketService from "./SocketService";

export default class CategoriesService {

    static async findAll() {
        const response = await axios.get('/api/categories');
        return response.data;
    }


    static async loadCategories() {
        store.commit('showMenuLoadingMessage');
        try {
            await SocketService.waitForSocketConnection();
            const categories = await CategoriesService.findAll();
            store.commit('setCategories', categories);    
        } catch (error) {
            store.dispatch('addErrorMessage', 'Failed to load categories');
        } finally {
            store.commit('hideMenuLoadingMessage');
        }
    }
}