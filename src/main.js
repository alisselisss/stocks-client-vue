import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from './components/LoginComponent.vue';
import DashboardComponent from "@/components/DashboardComponent.vue";
import AdminDashboard from "@/components/AdminDashboard.vue";
import store from '../store';
import io from 'socket.io-client';

const routes = [
    {
        path: '/login',
        name: 'LoginComponent',
        component: LoginComponent
    },
    {
        path: '/dashboard',
        name: 'DashboardComponent',
        component: DashboardComponent,
    },
    {
        path: '/admin-dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
    },

];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const socket = io('http://localhost:3000', {
    withCredentials: true,
});

const app = createApp(App);
app.use(store);
app.use(router);
app.config.globalProperties.$socket = socket;

app.mount('#app');

