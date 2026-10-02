import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<><div className="desktop-hint">F11 / ALT + ENTER — ПОЛНЫЙ ЭКРАН · ESC — ПАУЗА В ИГРЕ / ВЫХОД В МЕНЮ</div><Home offline/></>);
