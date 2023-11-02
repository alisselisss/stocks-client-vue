<template>
  <section id="login-container">
    <section class="modal-body">
      <div>
        <h1 class="modal-header">Login Page</h1>
        <form @submit.prevent="login">
          <section class="form-group">
            <label for="username">Введите имя пользователя:</label>
            <input type="text" v-model="username" class="form-control" id="loginInput" required/>
          </section>
          <button type="submit" class="btn btn-primary" id="loginButton">Login</button>
          <div v-if="errorMessage">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  name: 'LoginComponent',
  data() {
    return {
      username: '',
      errorMessage: null,
    };
  },
  methods: {
    async login() {
      try {
        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username: this.username}),
        });

        const data = await response.json();
        if (data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.user.name);
          console.log('Logged in as:', data.user);

          this.$store.commit('setUser', data.user);
          this.$router.push('/dashboard');
        } else this.errorMessage = 'User not found';
      } catch (error) {
        this.errorMessage = 'User not found';
        console.error('Login failed:', error.message);
      }
    },
  },
};
</script>

<style scoped>
#login-container {
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
</style>
