// ---------- настройки ----------
const SET = { sound: true, music: true, shake: 1 };
try { Object.assign(SET, JSON.parse(localStorage.getItem('chaosMageSettings') || '{}')); } catch (e) {}
const saveSet = () => { try { localStorage.setItem('chaosMageSettings', JSON.stringify(SET)); } catch (e) {} };
const SHAKE_MUL = [0, 0.3, 0.7];
const SHAKE_NAME = ['выкл', 'слабая', 'средняя'];
