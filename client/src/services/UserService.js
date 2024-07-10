import store from "@/store";
import axios from "axios";
import CategortiesService from "@/services/CategoriesService";

export default class UserService {
    static async registerRequest(userData) {
        const response = await axios.post('/api/users', userData);
        return response?.data;
    }
    static async register(userData) {
        let result = await this.registerRequest(userData);

        if (result && result.success) {
            await this.doLogin(userData);
        }

        return result;
    }
    static async loginRequest(userData) {
        const response = await axios.post('/api/auth/login', userData);
        return response.data;
    }
    
    static async doLogin(userData) {
        let result = await this.loginRequest(userData);

        if (result && result.success) {
            this.saveToken(result.access_token);
            await store.dispatch('loginAndSaveUserIfHasToken');
            await this.afterLoginActions();
        }

        return result;
    }

    static async loginWithGoogleRequest(token) {
        const response = await axios.post('/api/auth/google', {token});
        return response.data; 
    }

    static async afterLoginActions() {
        await CategortiesService.loadCategories();
    }


    static async loginWithGoogle(token) {
        let result = await this.loginWithGoogleRequest(token);

        if (result && result.success) {
            this.saveToken(result.access_token);
            await store.dispatch('loginAndSaveUserIfHasToken');
            await this.afterLoginActions();
        }

        return result;
    }
    static saveToken(token) {
        localStorage.setItem('jwtToken', token);
    }

    static getTokenFromLocalStorage() {
        return localStorage.getItem('jwtToken');
    }

    static removeTokenFromLocalStorage() {
        localStorage.removeItem('jwtToken');
    }

    static logout() {
        this.removeTokenFromLocalStorage();
        window.location.reload();
    }

    static async getAuthData(token) {
        const response = await axios.get('/api/auth/profile', {headers: {"Authorization" : `Bearer ${token}`}});
        return response.data;
    }

    static async loginIfHasToken() {
        let token = this.getTokenFromLocalStorage();

    if (token) {

            try {
                let result = await this.getAuthData(token);

                if (result.success) {
                    setTimeout(this.loginIfHasToken.bind(this), 1000 * 60 * 60 * 24);

                    this.saveToken(result.access_token);
                    axios.defaults.headers.common["Authorization"] = `Bearer ${result.access_token}`;
                    return result.user;
                }
            } catch (err) {
                if (err.response && err.response.status === 401) { 
                    this.removeTokenFromLocalStorage();
                }

                throw err;
            }

        }

        return null;
    }

    static async forgotPasswordRequest(email) {
        const response = await axios.post('/api/auth/forgot_password', {email});
        return response.data;
    }

    static async resetPassword(data) {
        const response = await axios.post('/api/auth/reset_password', data);
        return response.data;
    }

    static async updatePasswordRequest(data) {
        const response = await axios.post('/api/auth/update_password', data);
        return response.data;
    }

    static async updatePassword(data) {
        let result = await this.updatePasswordRequest(data);

        if (result && result.success) {
            await this.doLogin({
                email: store.getters.userData.email,
                password: data.newPassword,
            });
        }

        return result;
    }

    static async sendVerificationEmail() {
        const response = await axios.post('/api/auth/send_verification_email');
        return response.data;
    }

    static async updateUserInfoRequest(userData) {
        const response = await axios.patch('/api/users', userData);
        return response.data;
    }

    static async updateUserInfo(data) {
        let result = await this.updateUserInfoRequest(data);

        if (result && result.success) {
            await store.dispatch('loginAndSaveUserIfHasToken');
        }

        return result;
    }
}