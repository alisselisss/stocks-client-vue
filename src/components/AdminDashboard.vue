<template>
  <header class="modal-header">
    <router-link to="/dashboard">Покупка и продажа</router-link>
  </header>
  <div>
    <table v-if="users"  class="styled-table">
      <thead>
      <tr>
        <th>Пользователь</th>
        <th>Баланс</th>
        <th>Акции</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in users" :key="user.username">
        <td>{{ user.name }}</td>
        <td>{{ user.balance }}</td>
        <td>
          <table>
            <thead>
            <tr>
              <th>Тикер</th>
              <th>Количество</th>
              <th>Прибыль/убыток</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(stock, index) in user.stocks" :key="index">
              <td>{{ index }}</td>
              <td>{{ stock.quantity }}</td>
              <td>{{ calculateProfitLoss(stock, index) }}</td>
            </tr>
            </tbody>
          </table>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [],
      prices: [],
    };
  },
  created() {
    this.getAllUsers();
    const eventSource = new EventSource('http://localhost:3000/stock-exchange/sse');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      this.currentDate = data.timestamp;
      this.prices = data.prices;
      console.log(this.prices);
    };
    this.fetchCurrentDate();
  },
  methods: {
    calculateProfitLoss(stock, ticker) {
      const currentPrice = this.prices[ticker] || 0;
      console.log(currentPrice, this.prices, ticker, stock);
      if (currentPrice === 0 || !currentPrice || stock.quantity === 0 || !stock.purchasePrice || !stock) return 0;
      const profitLoss = (currentPrice - stock.purchasePrice) * stock.quantity;
      if (!profitLoss) return 0;
      return profitLoss >= 0 ? `+${profitLoss}` : profitLoss;
    },

    async getAllUsers() {
      try {
        const response = await fetch('http://localhost:3000/stock-exchange/users');
        if (response.ok) {
          const users = await response.json();
          this.users = users;
          console.log('Пользователи:', this.users);
        } else {
          console.error('Error fetching users:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    },
    async fetchCurrentDate() {
      fetch('http://localhost:3000/stock-exchange/current-date')
          .then(response => {
            const currentDate = response.headers.get('currentDate');
            console.log(currentDate);
            this.currentDate = currentDate;
          })
          .catch(error => {
            console.error('Error fetching current date:', error);
          });
    },
  },

};
</script>

<style scoped>
.styled-table {
  margin-left: 10%;
  border-collapse: collapse;
  width: 80%;
}

.styled-table th, .styled-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.styled-table th {
  background-color: #f2f2f2;
}

header {
  background-color: #333;
  margin-bottom: 20px;
}
</style>
