
import store from '@/store';
import io from 'socket.io-client';
import axios from 'axios';

export default class SocketService {

    static socket = null;
    static socketPromiseResolve = null;
    static socketPromiseReject = null;
    static socketPromise = new Promise((resolve, reject) => {
        this.socketPromiseResolve = resolve;
        this.socketPromiseReject = reject;
    });
    static isConnectedSuccessfully = false;


    static startSocket(token) {
        let url = window.location.host;

        if (window.location.port == '8080') {
            url = window.location.hostname + ':3000';
        }

        this.socket = io('ws://' + url, {
            auth: {
                token: `Bearer ${token}`
            },
            transports: ['websocket']
        });

        this.addSocketListeners(this.socket);

        store.commit('setSocket', this.socket);

        return this.socket;
    }

    static addSocketListeners(socket) {
        // socket.on('connect', () => {
        //     console.log('connect');
        // });

        socket.on('connectedWithAuth', (data) => {
            console.log('connected', data);
            axios.defaults.headers.common['Socket-UUID'] = data.uuid;
            this.isConnectedSuccessfully = true;

            store.commit('setSocketConnectionData', data);
            store.commit('setIsSocketConnected', true);
            this.socketPromiseResolve();
        });

        socket.on('disconnect', () => {
            delete axios.defaults.headers.common['Socket-UUID'];
            console.log('disconnected');
            store.commit('setIsSocketConnected', false);

            if (!this.isConnectedSuccessfully) {
                this.socketPromiseReject();
            } else {
                // disconnected for server/network issue
                this.socketPromise = new Promise((resolve, reject) => {
                    this.socketPromiseResolve = resolve;
                    this.socketPromiseReject = reject;
                })
            }
        });

        socket.on('multipleLogins', () => {
            store.dispatch('addPermenentErrorMessage', 'User already connected. Please close the other tabs and refresh the page.');
        });
    }

    static waitForSocketConnection() {
        return this.socketPromise;
    }
}