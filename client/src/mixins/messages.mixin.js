import { mapActions } from 'vuex';

export default {
    methods: {
        ...mapActions(['showLoadingMessage', 'hideLoadingMessage', 'addSuccessMessage', 'addErrorMessage']),
    }
}