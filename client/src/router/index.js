import { createRouter, createWebHistory } from 'vue-router';
import IndexPage from '@/components/pages/IndexPage.vue';
import Registration from '@/components/userManagement/Registration.vue';
import Login from '@/components/userManagement/Login.vue';
import ForgotPassword from '@/components/userManagement/ForgotPassword.vue';
import ResetPassword from '@/components/userManagement/ResetPassword.vue';
import Profile from '@/components/userManagement/Profile.vue';
import UpdatePassword from '@/components/userManagement/UpdatePassword.vue';

const routes = [
  {
    path: '/',
    name: 'IndexPage',
    component: IndexPage
  },
  {
    path: '/register',
    name: 'SignUp',
    component: Registration,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/forgot-password',
    name: 'Forgot Password',
    component: ForgotPassword,
  },
  {
    path: '/update-password',
    name: 'Update Password',
    component: UpdatePassword,
  },
  {
    path: '/reset-password/:passwordResetCode/:email',
    name: 'Reset Password',
    component: ResetPassword,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
