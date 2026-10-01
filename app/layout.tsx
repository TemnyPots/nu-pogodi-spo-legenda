import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Nu pogodi SPO LEGENDA — Отряды СПБСО",description:"Ретро-аркада: четыре желоба, одна корзинка и кирпичи стройотряда.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}

