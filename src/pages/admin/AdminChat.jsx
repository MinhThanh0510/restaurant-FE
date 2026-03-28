import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import "./AdminChat.css";

const socket = io("http://localhost:5000");
const ADMIN_ID = "69a688c423a22f24ab4a494f"; // 🔥 PHẢI KHỚP VỚI ID TRÊN

function AdminChat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef();

    // 1. Admin join vào room chính mình để đợi tin từ khách
    useEffect(() => {
        if (user) {
            socket.emit("join_room", ADMIN_ID);
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchConversations(); }, []);

    // 2. Load lịch sử khi chọn 1 khách hàng cụ thể
    useEffect(() => {
        if (selectedUser) {
            const fetchHistory = async () => {
                const res = await api.get(`/messages/history/${selectedUser._id}`);
                setMessages(res.data);
            };
            fetchHistory();
        }
    }, [selectedUser]);

    // 3. Lắng nghe tin nhắn Real-time (Sửa lỗi không nhận được phản hồi)
    useEffect(() => {
        const handleMsg = (data) => {
            // Nếu tin nhắn thuộc về user đang chat thì cập nhật khung chat
            if (selectedUser && (data.senderId === selectedUser._id || data.receiverId === selectedUser._id)) {
                setMessages((prev) => [...prev, data]);
            }
            fetchConversations(); // Luôn cập nhật sidebar để hiện tin mới nhất
        };

        socket.on("receive_message", handleMsg);
        return () => socket.off("receive_message", handleMsg);
    }, [selectedUser]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const chatData = {
            senderId: ADMIN_ID,
            receiverId: selectedUser._id,
            message: newMessage.trim()
        };

        socket.emit("send_message", chatData);
        setNewMessage("");
    };

    const filteredConversations = conversations.filter(conv => conv._id !== ADMIN_ID);

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-chat-container">
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Messages</h3>
                    {/* 🔥 SỬ DỤNG MẢNG ĐÃ LỌC ĐỂ ĐẾM SỐ LƯỢNG */}
                    <span className="conv-count">{filteredConversations.length} Active</span>
                </div>
                <div className="user-list">
                    {/* 🔥 SỬ DỤNG MẢNG ĐÃ LỌC ĐỂ HIỂN THỊ */}
                    {filteredConversations.map((conv) => (
                        <div
                            key={conv._id}
                            className={`user-item ${selectedUser?._id === conv._id ? "active" : ""}`}
                            onClick={() => setSelectedUser(conv)}
                        >
                            <div className="user-avatar-wrapper">
                                <div className="user-avatar">{conv.fullName.charAt(0)}</div>
                                <div className="online-indicator"></div>
                            </div>
                            <div className="user-info">
                                <div className="user-info-top">
                                    <p className="user-name">{conv.fullName}</p>
                                    <span className="last-msg-time">{formatTime(conv.lastTime)}</span>
                                </div>
                                <p className="last-msg">{conv.lastMessage || "No messages yet"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-main">
                {selectedUser ? (
                    <>
                        <div className="chat-main-header">
                            <div className="header-user-info">
                                <div className="user-avatar small">{selectedUser.fullName.charAt(0)}</div>
                                <div>
                                    <h4>{selectedUser.fullName}</h4>
                                    <span className="status-text">Customer</span>
                                </div>
                            </div>
                        </div>

                        <div className="chat-main-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`msg-row ${msg.senderId === ADMIN_ID ? "admin" : "client"}`}>
                                    <div className="msg-wrapper">
                                        <div className="msg-content">
                                            {msg.message}
                                        </div>
                                        <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef}></div>
                        </div>

                        <form className="chat-main-input" onSubmit={handleSend}>
                            <div className="input-wrapper">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Write a message..."
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="empty-state-icon">💬</div>
                        <p>Select a customer to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminChat;