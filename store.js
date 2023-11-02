import {createStore} from 'vuex';

export default createStore({
    state: {
        user: null,
        users: null,
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
        },
        setUsers(state, users) {
            state.users = users;
        },
    },
    actions: {
        async loadUser({commit}) {
            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({username: localStorage.getItem('username')}),
                });

                const data = await response.json();
                commit('setUser', data.user);
            } catch (error) {
                console.error('Ошибка при загрузке пользователя', error);
            }
        },
        async getAllUsers({commit}) {
            try {
                const response = await fetch('http://localhost:3000/stock-exchange/users');
                if (response.ok) {
                    const users = await response.json();
                    this.users = users;
                    console.log('Пользователи:', this.users);
                    commit('setUsers', this.users);
                } else {
                    console.error('Ошибка при получении пользователей:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        }
    },
})
;
