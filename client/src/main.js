import { createApp } from 'vue'
import App from './App.vue'
//import signup from './views/Signup.vue'
import router from './router'
import store from './store'

createApp(App).use(store).use(router).mount('#app')
//createApp(signup).use(store).use(router).mount('#signup')

