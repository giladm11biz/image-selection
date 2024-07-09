<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form" :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Password Reset Request</div>
      </div>
        <div class="form-table">
            <div class="input-label">Email*</div>
            <el-form-item prop="email" class="input-size">
              <el-input v-model.trim="form.email" required clearable class="input-size" :maxlength="32"></el-input>
            </el-form-item>
          </div>
        <div>
          <el-button type="primary" native-type="submit" class="form-button-style">Send Reset Password Email</el-button>
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
  name: 'ForgotPassword',
  mixins: [FormMixin],
  data() {
    return {
      form: {
        email: '',
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
      };
    }
  },
  methods: {
    async submitAction() {
      return await UserService.forgotPasswordRequest(this.form.email);
    },
    onSubmitSuccess() {
      this.addSuccessMessage("A reset password mail has been sent. Please check your email. If you don't receive it, please check your spam folder.");
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



