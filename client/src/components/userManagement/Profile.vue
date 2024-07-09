<template>
  <div class="form-page">
    <el-form ref="form" @submit.prevent="submitForm" class="form-center" status-icon :model="form"
      :rules="rulesWithServerValidation">
      <div class="form-title-holder">
        <div class="form-title">Your Profile</div>
      </div>
      <div class="form-table">
        <div class="input-label">Email</div>
        <div class="value-label">{{ form.email }}</div>
        <div class="input-label">
          <el-tooltip
        class="box-item"
        content="Email verification status - you become verified once you verify your email"
        placement="bottom"
      >
        <div class="icon-holder">
          Status <InformationCircleIcon class="icon right big" />
        </div>
      </el-tooltip>
      </div>
        <div class="value-label">
          <el-tag type="success" class="icon-holder" v-if="form.isVerified">
            <CheckCircleIcon class="icon" /> Verified
          </el-tag>
          <div v-else class="badge-with-button">
            <el-tag type="danger" class="icon-holder">
              <XCircleIcon class="icon" /> Not verified
            </el-tag>
            <el-button type="success" @click="sendVerificationEmail" class="form-button-style">Resend Email</el-button>

          </div>
        </div>
        <div class="input-label">Name</div>
        <el-form-item prop="name" class="input-size">
          <el-input v-model="form.name" required clearable class="input-size" :maxlength="255"></el-input>
        </el-form-item>
        <div class="input-label">Nickname</div>
        <el-form-item prop="nickname" class="input-size">
          <el-input v-model="form.nickname" clearable class="input-size" :maxlength="30"></el-input>
        </el-form-item>
        <el-form-item prop="mailUpdates" class="input-size full-row">
          <el-checkbox v-model="form.mailUpdates" class="input-size">Send me updates via email</el-checkbox>
        </el-form-item>

      </div>
      <div>
        <el-button type="primary" native-type="submit" class="form-button-style">Update</el-button>
      </div>
      <div class="already-has-account">
        <router-link to="/update-password">Change password</router-link>
      </div>
    </el-form>
  </div>
</template>

<script>
import UserService from '@/services/UserService';
import FormMixin from '@/mixins/form.mixin';
import { mapGetters } from 'vuex'
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/solid"
import { InformationCircleIcon } from "@heroicons/vue/24/outline"

export default {
  name: 'Profile',
  mixins: [FormMixin],
  components: {
    CheckCircleIcon, XCircleIcon, InformationCircleIcon
  },
  data() {
    return {
      form: {
      },
      isUpdating: false,
    }
  },
  created() {
    if (this.isAuthenticated) {
      this.form = { ...this.userData };
    } else {
      if (this.isAuthenticating) {
        this.showLoadingMessage();
      } else {
        this.$router.push('/login');
      }
    }
  },
  watch: {
    isAuthenticating() {
      if (this.isUpdating) {
        return;
      }

      if (this.isAuthenticated) {
        this.form = { ...this.userData };
        this.hideLoadingMessage();
      } else {
        this.hideLoadingMessage();
        this.$router.push('/login');
      }
    }
  },
  computed: {
    ...mapGetters(['userData', 'isAuthenticated', 'isAuthenticating']),

    rules() {
      return {
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
      };
    }
  },
  methods: {
    async submitAction() {
      this.isUpdating = true;
      return await UserService.updateUserInfo(this.form);
    },
    onSubmitSuccess() {
      this.isUpdating = false;
      this.addSuccessMessage("You have successfully updated your profile.");
    },
    async sendVerificationEmail() {
      this.showLoadingMessage();

      try {
        let result = await UserService.sendVerificationEmail();
        if (result.success) {
          this.addSuccessMessage('A verification email has been sent. Please check your email. If you don\'t receive it, please check your spam folder.');
        } else {
          throw new Error('server didn\'t return success');
        }
      }
      catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.errors) {
          const errors = err.response.data.errors;
          this.addErrorMessage(errors.email.join(', '));
        } else {
          console.error(err);
          this.addErrorMessage("There was an error. Please try again. If the problem persists, please contact us.");
        }
      }

      this.hideLoadingMessage();
    }
  }
}
</script>

<style scoped>
.already-has-account {
  margin-top: 20px;
}

.badge-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-with-button .el-button {
  height: 25px;
  width: 140px;
}
</style>
