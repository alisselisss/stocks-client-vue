<template>
  <div>
    <header class="modal-header">
      <router-link v-if="currentUser && currentUser.role === 'admin'" to="/admin-dashboard">Админ-панель</router-link>
    </header>
    <h3 v-if="currentUser" id="hello">Привет, {{ currentUser.name }}</h3>
    <p>Текущая имитируемая дата:<span id="balanceElement">{{ currentDate }}</span></p>
    <p>Текущая стоимость акций:</p>
    <ul>
      <li v-for="(price, index) in prices" :key="index">{{ index }} : {{ price }}</li>
    </ul>
    <p v-if="currentUser && currentUser.balance">Баланс: {{ parseFloat(currentUser.balance || 0).toFixed(2) }}</p>
    <div v-if="currentUser && currentUser.stocks">
      <table v-if="currentUser && currentUser.stocks">
        <thead>
        <tr>
          <th>Тикер</th>
          <th>Количество</th>
          <th>Цена покупки</th>
          <th>Стоимость</th>
          <th>Прибыль/убыток</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(stock, ticker) in currentUser.stocks" :key="ticker">
          <td>{{ ticker }}</td>
          <td>{{ stock.quantity || 0 }}</td>
          <td>{{ parseFloat(calculateStockValue(stock).toFixed(2)) }}</td>
          <td>{{ parseFloat(stock.purchasePrice.toFixed(2)) }}</td>
          <td>{{ calculateProfitLoss(stock, ticker) || 0 }}</td>
          <td>
            <input v-model="quantityToBuySell" class="form-control" type="number" min="1" max="{{ stock.quantity }}"/>
          </td>
          <td>
            <button @click="buyStock(ticker)" class="btn btn-success" id="{{ ticker }}">Купить</button>
          </td>
          <td>
            <button @click="sellStock(ticker)" class="btn btn-primary">Продать</button>
          </td>
          <td>
            <button @click="openGraphDialog(ticker)" class="btn btn-primary" v-if="prices[ticker]">Открыть график</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="dialog-container" :class="{ 'hidden': !isChartDialogOpen }" @click="closeChartDialog">
      <div class="dialog" @click.stop>
        <button @click="closeChartDialog" class="btn btn-primary">Закрыть</button>
        <canvas id="myChart" width="400" height="400"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import {Line} from 'vue-chartjs';
import Chart from 'chart.js/auto';

export default {
  extends: Line,
  name: "DashBoard",

  data() {
    return {
      isChartDialogOpen: false,
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Close Price',
            data: [],
            borderColor: 'rgba(75,192,192,1)',
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
      currentDate: null,
      prices: [],
      portfolio: [],
      quantityToBuySell: 0,
      start: null,
      myChart: null,
    };
  },

  computed: {
    currentUser() {
      this.loadData();
      return this.$store.state.user;
    },
  },
  mounted() {
    console.log('Полученный пользователь:', this.currentUser);
  },

  created() {
    this.loadData();
    this.user = this.$store.state.user;

    const eventSource = new EventSource('http://localhost:3000/stock-exchange/sse');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      this.currentDate = data.timestamp;
      this.prices = data.prices;
      this.startDate = data.start;
      console.log(this.prices);
    };
    this.fetchCurrentDate();
  },

  methods: {
    calculateStockValue(stock) {
      return stock.purchasePrice / stock.quantity;
    },
    calculateProfitLoss(stock, ticker) {
      const currentPrice = this.prices[ticker] || 0;
      if (currentPrice === 0 || !currentPrice || stock.quantity === 0 || !stock.purchasePrice || !stock) return 0;
      const profitLoss = currentPrice * stock.quantity - stock.purchasePrice;
      if (!profitLoss) return 0;
      return profitLoss >= 0 ? `+${profitLoss}` : profitLoss;
    },

    loadData() {
      this.$store.dispatch('loadUser');
    },

    async fetchCurrentDate() {
      fetch('http://localhost:3000/stock-exchange/current-date')
          .then(response => {
            const currentDate = response.headers.get('currentDate');
            this.currentDate = currentDate;
          })
          .catch(error => {
            console.error('Error fetching current date:', error);
          });
    },

    async openGraphDialog(ticker) {
      for (const stock in this.prices) {
        if (stock === ticker) {
          try {
            const response = await fetch('http://localhost:3000/stock-exchange/graph', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticker: stock,
              }),
            });

            const responseData = await response.json();
            const stocks = responseData.dataset.data;

            const ctx = document.getElementById('myChart').getContext('2d');

            if (this.myChart) {
              this.myChart.destroy();
              this.myChart = null;
            }

            if (!this.myChart) {
              console.log(typeof stocks.map((stock) => stock[0])[0])
              this.myChart = new Chart(ctx, {
                type: 'line',
                data: {
                  labels: stocks.map((stock) => stock[0]),
                  datasets: [{
                    label: 'Close price',
                    data: stocks.map((stock) => stock[8]),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false,
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'category',
                    },
                    y: {
                      beginAtZero: true,
                    },
                  },
                }
              });
            } else {
              this.myChart.data.labels = stocks.map((stock) => stock[0]);
              this.myChart.data.datasets[0].data = stocks.map((stock) => stock[8]);
              this.myChart.update();
            }
            this.isChartDialogOpen = true;
          } catch
              (error) {
            console.error('Ошибка при получении данных для графика:', error);
          }
        }
      }
    },

    closeChartDialog() {
      //this.graphic = false;
      this.isChartDialogOpen = false;
    },

    async buyStock(ticker) {
      if (this.currentUser && this.currentUser.stocks) {
        const currentPrice = this.prices[ticker] || 0;
        if (currentPrice === 0) return 0;
        const totalCost = currentPrice * this.quantityToBuySell;

        if (totalCost <= this.currentUser.balance) {
          try {
            const response = await fetch('http://localhost:3000/stock-exchange/buy-stock', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticker,
                quantity: this.quantityToBuySell,
                username: localStorage.getItem('username')
              }),
            });

            if (response.ok) {
              this.currentUser.balance -= totalCost;
              this.currentUser.stocks[ticker].quantity += this.quantityToBuySell;
            } else {
              console.error('Ошибка при покупке акций:', response.statusText);
            }
          } catch (error) {
            console.error('Ошибка при покупке акций:', error);
          }
        } else {
          alert('Недостаточно средств для покупки.');
        }
      }
    },

    async sellStock(ticker) {
      if (this.currentUser && this.currentUser.stocks) {
        const currentPrice = this.prices[ticker] || 0;
        if (currentPrice === 0) return 0;
        const totalValue = this.calculateStockValue(this.currentUser.stocks[ticker]);

        if (this.quantityToBuySell <= this.currentUser.stocks[ticker].quantity) {
          try {
            const response = await fetch('http://localhost:3000/stock-exchange/sell-stock', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticker,
                quantity: this.quantityToBuySell,
                username: localStorage.getItem('username')
              }),
            });

            if (response.ok) {
              this.currentUser.balance += totalValue;
              this.currentUser.stocks[ticker].quantity -= this.quantityToBuySell[ticker];
            } else {
              console.error('Ошибка при продаже акций:', response.statusText);
            }
          } catch (error) {
            console.error('Ошибка при продаже акций:', error);
          }
        } else {
          console.log(this.quantityToBuySell, this.currentUser.stocks[ticker].quantity)
          alert('Недостаточно акций для продажи.');
        }
      }
    }
  }
  ,
}
;
</script>

<style scoped>
.dialog-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Полупрозрачный фон */
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

header {
  background-color: #333;
  margin-bottom: 20px;
}

table {
  margin-left: auto;
  margin-right: auto;
}

.hidden {
  display: none;
}

#myChart {
  max-width: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  height: 400px !important;
}
.dialog-container {
  width: 90%;
  height: 90%;
}
.dialog {
  width: 90%;
  height: 90%;
}
</style>