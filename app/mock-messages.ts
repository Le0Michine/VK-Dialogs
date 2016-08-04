import { Message } from './message'

export const messagesFromNick: Message[] = [
    {id: 1, title: "...", body: "Hi", out: true, user_id: 123, date: "8.02pm", read_state: true },
    {id: 1, title: "...", body: "The first message", out: false, user_id: 123, date: "9.02pm", read_state: true },
    {id: 2, title: "...", body: "The second message", out: true, user_id: 123, date: "9.03pm", read_state: true },
    {id: 3, title: "...", body: "The third message", out: false, user_id: 123, date: "9.20pm", read_state: false },
    {id: 4, title: "...", body: "The fourth message", out: false, user_id: 123, date: "9.45pm", read_state: false }
];

export const messagesFromSofy: Message[] = [
    {id: 1, title: "...", body: "Hi", out: false, user_id: 1234, date: "9.02pm", read_state: true },
    {id: 2, title: "...", body: "hehe", out: true, user_id: 1234, date: "9.45pm", read_state: true },
    {id: 3, title: "...", body: "Buy", out: true, user_id: 1234, date: "9.46pm", read_state: true }
];