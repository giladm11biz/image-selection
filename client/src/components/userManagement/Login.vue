<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form" :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Log In</div>
      </div>
      <temolate v-if="isGoogleAuthLoaded">
        <div class="google-login">
        <div ref="googleLogin" data-type="standard"></div>
        </div>
        <div class="or">Or</div>
      </temolate>
        <div class="form-table">
            <div class="input-label">Email*</div>
            <el-form-item prop="email" class="input-size">
              <el-input v-model.trim="form.email" required clearable class="input-size" :maxlength="32"></el-input>
            </el-form-item>
            <div class="input-label">Password*</div>
            <el-form-item prop="password" class="input-size">
              <el-input v-model="form.password" show-password required clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
          </div>
        <div>
          <el-button type="primary" native-type="submit" class="form-button-style">Login</el-button>
        </div>
        <div class="registration">
          <el-button type="success" @click="$router.push('/register')" class="form-button-style">I don't have an account</el-button>
        </div>
        <div class="forgot-password">
          <router-link to="/forgot-password">I forgot my password</router-link>
        </div>
    </el-form>
  </div>
</template>

<script>
import UserService from '@/services/UserService';
import FormMixin from '@/mixins/form.mixin';
import { mapGetters } from 'vuex';

export default {
  name: 'Login',
  mixins: [FormMixin],
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
    }
  },
  mounted() {
    if (this.isGoogleAuthLoaded) {
      this.renderGoogleLogin();
    }
  },
  computed: {
    ...mapGetters(['isGoogleAuthLoaded']),
    rules() {
      return {
        email: [
          {
            required: true,
            message: 'Please input email',
            trigger: 'blur'
          },
          {
            type: 'email',
            message: 'Email is not valid',
            trigger: ['blur', 'change']
          }
        ],
        password: [
          {
            required: true,
            message: 'Please input password',
            trigger: 'blur'
          },
          {
            min: 8,
            max: 32,
            message: 'Password should be between 8 and 32 characters',
            trigger: ['blur', 'change']
          }
        ],
      };
    }
  },
  methods: {
    async submitAction() {
      return await UserService.doLogin(this.form);
    },
    onSubmitSuccess() {
      this.addSuccessMessage("You have successfully logged in.");
      this.$router.push('/');
    },
    renderGoogleLogin() {
      window.google.accounts.id.disableAutoSelect()

      window.google.accounts.id.renderButton(this.$refs.googleLogin, {
        theme: 'filled_black',
        text: 'continue_with',

      });
    }
  },
  watch: {
    async isGoogleAuthLoaded(newValue) {
      if (newValue) {
        await this.$nextTick();
        this.renderGoogleLogin();
      }
    }
  }

}
</script>

<style scoped>
  .forgot-password {
    margin-top: 20px;
  }

  .registration {
    margin-top: 20px;
  }

  .google-login {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }

  .or {
    margin-bottom: 20px;
  }

</style>



