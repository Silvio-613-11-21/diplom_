import Router from './src/app/router/route.ts'
const app = document.getElementById("app") as HTMLElement; 
Router(app); 


// var ws = new WebSocket(
//   "ws:///localhost:5173"
// );

// ws.onopen =  function (event) {
//     ws.send("i")
// }

// const ws = new WebSocket('ws://localhost:8765');
// ws.onopen = () => console.log('Подключено');
// ws.onmessage = (e) => console.log('Сообщение:', e.data);
// ws.onerror = (e) => console.log('Ошибка:', e);