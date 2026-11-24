import {DefaultChatTransport} from 'ai' 

const apiUrl = import.meta.env.VITE_API_URL

export const ChatTransport = new DefaultChatTransport(
    {
        api: `${apiUrl}/api/v1/chat/stream`, 

        credentials: "include",

        prepareSendMessagesRequest({messages, body}){
            const lastMessage = messages.at(-1);
            const text = lastMessage?.parts.filter((part) => part.type == 'text').map((part) => part.text).join("") ?? "";

            return {
                body: {
                    message: text,
                    thread_id: body?.thread_id ?? null,
                    document_id: body?.document_id ?? null,
                },
            }
        }
    }
)
