'use client'
import { formatChatMessageTime, formatMessageDate, placeholderImage, t } from "@/utils";
import Image from "next/image";
import { useSelector } from "react-redux";
import { List } from 'react-window';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

const ChatMessages = ({ chatMessages, selectedTabData, openImageViewer, systemSettingsData, IsLoadPrevMesg, CurrentMessagesPage, HasMoreChatMessages, fetchChatMessgaes }) => {

    const isLoggedIn = useSelector((state) => state.UserSignup);
    const userCurrentId = isLoggedIn && isLoggedIn.data ? isLoggedIn.data.data.id : null;
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(500);
    const [flattenedMessages, setFlattenedMessages] = useState([]);

    // Calculate container height
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const viewportHeight = window.innerHeight;
                const estimatedHeight = Math.max(400, viewportHeight - 400); // Account for chat input/header
                setContainerHeight(estimatedHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Flatten messages with date separators for virtual scrolling
    useEffect(() => {
        if (!chatMessages || chatMessages.length === 0) {
            setFlattenedMessages([]);
            return;
        }

        const grouped = chatMessages.reduce((acc, message) => {
            const date = formatMessageDate(message.created_at) || 'Invalid Date';
            if (!acc[date]) acc[date] = [];
            acc[date].push(message);
            return acc;
        }, {});

        const flattened = [];
        Object.entries(grouped)
            .reverse()
            .forEach(([date, messages]) => {
                // Add date separator as a special item
                flattened.push({ type: 'date-separator', date, id: `date-${date}` });
                // Add messages
                messages.forEach((message, index) => {
                    flattened.push({ ...message, date, id: `msg-${message.id || index}` });
                });
            });

        setFlattenedMessages(flattened);
    }, [chatMessages]);

    // Render a single message item
    const renderMessage = useCallback((message) => {
        if (message.type === 'date-separator') {
            return (
                <div className="date-separator" key={message.id}>
                    <span>{message.date}</span>
                </div>
            );
        }

        return (
            <div key={message.id} className="chat_message_item">
                {message.message_type === "text" && (
                    <div className={`${message.sender_id === userCurrentId ? "sender_message" : "other_message"}`}>
                        <p className="sender_single_text_cont">
                            {message?.message}
                        </p>
                        <p className="chat_time">{formatChatMessageTime(message?.created_at)}</p>
                    </div>
                )}
                {message.message_type === "file" && (
                    <div className={`${message.sender_id === userCurrentId ? "sender_message" : "other_message"}`}>
                        <div className="file_img" onClick={() => openImageViewer(message?.file)}>
                            <Image src={message?.file ? message?.file : systemSettingsData?.data?.data?.placeholder_image} width={0} height={0} alt='file' className='chat_file_img' loading='lazy' onErrorCapture={placeholderImage} />
                        </div>
                        <p className="chat_time">{formatChatMessageTime(message?.created_at)}</p>
                    </div>
                )}
                {message.message_type === "audio" && (
                    <div className={`${message.sender_id === userCurrentId ? "sender_message" : "other_message"}`}>
                        <div className="chat_audio">
                            <audio controls>
                                <source src={message?.audio} type="audio/mpeg" />
                                {t('browserDoesNotSupportAudio')}
                            </audio>
                        </div>
                        <p className="chat_time">{formatChatMessageTime(message?.created_at)}</p>
                    </div>
                )}
                {message.message_type === "file_and_text" && (
                    <div className={`${message.sender_id === userCurrentId ? "sender_message" : "other_message"}`}>
                        <div className="file_text">
                            <div className="text_file_img" onClick={() => openImageViewer(message?.file)}>
                                <Image src={message?.file ? message?.file : systemSettingsData?.data?.data?.placeholder_image} width={0} height={0} alt='file' className='chat_file_img' loading='lazy' onErrorCapture={placeholderImage} />
                                <div className="text">
                                    <span>{message.message}</span>
                                </div>
                            </div>
                        </div>
                        <p className="chat_time">{formatChatMessageTime(message?.created_at)}</p>
                    </div>
                )}
            </div>
        );
    }, [userCurrentId, openImageViewer, systemSettingsData]);

    // List row renderer component for virtual scrolling (react-window v2 API)
    const ListRow = useCallback(({ index, style, ...rest }) => {
        const item = flattenedMessages[index];
        if (!item) return <div style={style} />;

        // Estimate item height based on type
        const estimatedHeight = item.type === 'date-separator' ? 40 : 
                               item.message_type === 'file' || item.message_type === 'file_and_text' ? 200 : 
                               item.message_type === 'audio' ? 80 : 100;

        return (
            <div style={{ ...style, minHeight: estimatedHeight }}>
                {renderMessage(item)}
            </div>
        );
    }, [flattenedMessages, renderMessage]);

    // Use virtual scrolling only if there are many messages (> 30)
    const useVirtualScrolling = flattenedMessages.length > 30;
    const itemHeight = 100; // Average estimated height

    return (
        <>
            {
                HasMoreChatMessages &&
                <button disabled={IsLoadPrevMesg} className='date-separator loadPrevMessages' onClick={() => fetchChatMessgaes(selectedTabData.id, CurrentMessagesPage + 1)}>
                    {t('loadPrevMesgs')}
                </button>
            }

            {useVirtualScrolling && flattenedMessages.length > 0 ? (
                // ✅ Virtual scrolling for long message lists
                <div ref={containerRef} style={{ width: '100%', height: containerHeight }}>
                    <List
                        height={containerHeight}
                        rowCount={flattenedMessages.length}
                        rowHeight={itemHeight}
                        style={{ width: '100%' }}
                        overscanCount={5} // Render 5 extra items for smoother scrolling
                        rowComponent={ListRow}
                    />
                </div>
            ) : (
                // Regular rendering for shorter lists
                <div className="chat_render_msgs">
                    {flattenedMessages.map((item) => renderMessage(item))}
                </div>
            )}
        </>
    )
}

export default ChatMessages