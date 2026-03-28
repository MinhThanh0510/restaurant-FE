import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { toast } from "react-toastify";
import "./Chatbox.css";

const socket = io("http://localhost:5000");
const ADMIN_ID = "69a688c423a22f24ab4a494f"; // 🔥 Thay ID Admin thực tế của bạn vào đây

function Chatbox() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef();

    // 1. Lấy lịch sử khi mở khung chat
    useEffect(() => {
        if (isOpen && user) {
            const fetchHistory = async () => {
                try {
                    const res = await api.get(`/messages/history/${ADMIN_ID}`);
                    setMessages(res.data);
                } catch (err) {
                    console.error("Error fetching chat history:", err);
                }
            };
            fetchHistory();
        }
    }, [isOpen, user]);

    // 2. Kết nối Socket & lắng nghe tin nhắn real-time
    useEffect(() => {
        if (user) {
            socket.emit("join_room", user._id || user.id);
        }

        const handleReceive = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on("receive_message", handleReceive);
        return () => socket.off("receive_message", handleReceive);
    }, [user]);

    // 3. Auto-scroll xuống cuối cùng
    useEffect(() => {
        if (isOpen) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!user) return toast.warning("Please sign in to chat with our concierge.");
        if (!message.trim()) return;

        const chatData = {
            senderId: user._id || user.id,
            receiverId: ADMIN_ID,
            message: message.trim()
        };

        socket.emit("send_message", chatData);
        setMessage(""); // Reset input
    };

    return (
        <div className="chat-wrapper">

            {/* Nút mở/đóng Chat */}
            <button className={`chat-toggle ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                )}
            </button>

            {/* Cửa sổ Chat */}
            <div className={`chat-window glass-panel ${isOpen ? "show" : "hide"}`}>

                <div className="chat-header">
                    <div className="header-info">
                        <div className="status-indicator">
                            <span className="pulse-dot"></span>
                        </div>
                        <div>
                            <h4>Concierge</h4>
                            <span className="reply-time">Typically replies instantly</span>
                        </div>
                    </div>
                </div>

                <div className="chat-messages">
                    {/* Tin nhắn chào mừng tự động */}
                    <div className="msg-row theirs">
                        <div className="msg-avatar">C</div>
                        <div className="msg-bubble theirs">
                            Welcome{user ? ` back, ${user.fullName.split(" ")[user.fullName.split(" ").length - 1]}` : ""}! How may we assist you with your dining experience today?
                        </div>
                    </div>

                    {messages.map((msg, index) => {
                        const isMine = msg.senderId === (user?._id || user?.id);
                        return (
                            <div key={index} className={`msg-row ${isMine ? "mine" : "theirs"}`}>
                                {!isMine && <div className="msg-avatar">C</div>}
                                <div className={`msg-bubble ${isMine ? "mine" : "theirs"}`}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef}></div>
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        autoComplete="off"
                        disabled={!user}
                    />
                    <button type="submit" className="btn-send" disabled={!message.trim() || !user}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>

                {/* Cảnh báo chưa đăng nhập ngay trên input */}
                {!user && (
                    <div className="login-prompt">
                        Please <a href="/login">sign in</a> to start chatting.
                    </div>
                )}
            </div>

        </div>
    );
}

export default Chatbox;