<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form" :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Reset Password</div>
      </div>
        <div class="form-table">
          <div class="input-label">Password*</div>
            <el-form-item prop="password" class="input-size">
              <el-input v-model="form.password" show-password required clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
            <div class="input-label">Password Confirmation*</div>
            <el-form-item prop="passwordConfirmation" class="input-size">
              <el-input v-model="form.passwordConfirmation" show-password required clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
          </div>
        <div>
          <el-button type="primary" native-type="submit" class="form-button-style">Change Password</el-button>
        </div>
        <div class="back">
          <router-link to="/login">Back</router-link>
        </div>
    </el-form>
  </div>
</template>

<script>
import UserService from '@/services/UserService';
import FormMixin from '@/mixins/form.mixin';

export default {
  name: 'ResetPassword',
  mixins: [FormMixin],
  data() {
    return {
      form: {
        password: '',
        passwordConfirmation: '',
      },
    }
  },
  computed: {
    rules() {
      return {
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
      return await UserService.resetPassword({
        password: this.form.password,
        email: this.$route.params.email,
        passwordResetCode: this.$route.params.passwordResetCode
      });
    },
    onSubmitSuccess() {
      this.addSuccessMessage("Your password has been reset. Please login with your new password.");
      this.$router.push('/login');
    },
  }
}
</script>

<style scoped>
  .back {
      margin-top: 20px;
  }

</style>



