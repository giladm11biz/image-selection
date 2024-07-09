<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form" :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Change Password</div>
      </div>
        <div class="form-table">
          <div class="input-label">Old Password*</div>
            <el-form-item prop="oldPassword" class="input-size">
              <el-input v-model="form.oldPassword" show-password clearable :minlength="8" class="input-size"></el-input>
            </el-form-item>
          <div class="input-label">New Password*</div>
            <el-form-item prop="newPassword" class="input-size">
              <el-input v-model="form.newPassword" show-password required clearable :minlength="8" class="input-size"></el-input>
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
          <router-link to="/profile">Back</router-link>
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
        oldPassword: '',
        newPassword: '',
        passwordConfirmation: '',
      },
    }
  },
  computed: {
    rules() {
      return {
        oldPassword: [
          {
            min: 8,
            max: 32,
            message: 'Password should be between 8 and 32 characters',
            trigger: ['blur', 'change']
          }
        ],
        newPassword: [
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
      if (value !== this.form.newPassword) {
        callback(new Error('Passwords do not match'));
      } else {
        callback();
      }
    },
    async submitAction() {
      return await UserService.updatePassword(this.form);
    },
    onSubmitSuccess() {
      this.addSuccessMessage("Your password has been updated.");
      this.$router.push('/profile');
    },
  }
}
</script>

<style scoped>
  .back {
      margin-top: 20px;
  }

</style>



