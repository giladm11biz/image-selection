
import store from '@/store';
import io from 'socket.io-client';

export default class SocketService {

    static startSocket(token) {
        let url = window.location.host;

        if (window.location.port == '8080') {
            url = window.location.hostname + ':3000';
        }

        let socket = io('ws://' + url, {
            auth: {
                token: `Bearer ${token}`
            },
            transports: ['websocket']
        });

        this.addSocketListeners(socket);

        store.commit('setSocket', socket);

        return socket;
    }

    static addSocketListeners(socket) {
        socket.on('connect', () => {
            console.log('connect');
        });

        socket.on('connected', () => {
            console.log('connected');
            store.commit('setIsSocketConnected', true);
        });

        socket.on('disconnect', () => {
            console.log('disconnected');
            store.commit('setIsSocketConnected', false);
        });
    }
}