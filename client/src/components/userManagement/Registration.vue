<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form" :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Sign Up</div>
      </div>
        <div class="form-table">
            <div class="input-label">Email*</div>
            <el-form-item prop="email" class="input-size">
              <el-input v-model.trim="form.email" required clearable class="input-size" :maxlength="32"></el-input>
            </el-form-item>
            <div class="input-label">Name*</div>
            <el-form-item prop="name" class="input-size">
              <el-input v-model="form.name" required clearable class="input-size" :maxlength="255"></el-input>
            </el-form-item>
            <div class="input-label">Nickname</div>
            <el-form-item prop="nickname" class="input-size">
              <el-input v-model="form.nickname" clearable class="input-size" :maxlength="30"></el-input>
            </el-form-item>
            <div class="input-label">Password*</div>
            <el-form-item prop="password" class="input-size">
              <el-input v-model="form.password" show-password required clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
            <div class="input-label">Password Confirmation*</div>
            <el-form-item prop="passwordConfirmation" class="input-size">
              <el-input v-model="form.passwordConfirmation" show-password required clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
            <el-form-item prop="mailUpdates" class="input-size full-row">
              <el-checkbox v-model="form.mailUpdates" class="input-size">Send me updates via email</el-checkbox>
            </el-form-item>

          </div>
        <div>
          <el-button type="primary" native-type="submit" class="form-button-style">Register</el-button>
        </div>
        <div class="already-has-account">
          <router-link to="/login">I already have an account</router-link>
        </div>
    </el-form>
  </div>
</template>

<script>
import UserService from '@/services/UserService';
import FormMixin from '@/mixins/form.mixin';
// import Consts from '@/consts';

export default {
  name: 'Registration',
  mixins: [FormMixin],
  data() {
    return {
      form: {
        nickname: '',
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        mailUpdates: false,
      },
    }
  },
  computed: {
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
        name: [
          {
            required: true,
            message: 'Please input name',
            trigger: 'blur'
          },
          {
            min: 2,
            message: 'Minimum length is 2',
            trigger: ['blur', 'change']
          },
          {
            max: 255,
            message: 'Maximum length is 255',
            trigger: ['blur', 'change']
          },
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Only English letters and numbers',
            trigger: ['blur', 'change']
          },
        ],
        nickname: [
          {
            min: 2,
            message: 'Minimum length is 2',
            trigger: ['blur', 'change']
          },
          {
            max: 30,
            message: 'Maximum length is 30',
            trigger: ['blur', 'change']
          },
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Only English letters and numbers',
            trigger: ['blur', 'change']
          },
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
        passwordConfirmation: [
          {
            required: true,
            message: 'Please input password confirmation',
            trigger: 'blur'
          },
          {
            validator: this.validatePasswords,
            trigger: 'blur'
          }
        ]
      };
    }
  },
  methods: {
    validatePasswords(rule, value, callback) {
      if (value !== this.form.password) {
        callback(new Error('Passwords do not match'));
      } else {
        callback();
      }
    },
    async submitAction() {
      return await UserService.register(this.form);
    },
    onSubmitSuccess() {
      this.addSuccessMessage("You have successfully registered. Please verify your email.");
      this.$router.push('/');
    },
    
  }
}
</script>

<style scoped>
.already-has-account {
  margin-top: 20px;
}
</style>




