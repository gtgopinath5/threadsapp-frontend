import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Skeleton, SkeletonCircle, Text, useColorModeValue } from "@chakra-ui/react";
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext"; // Ensure this path is correct

const ChatPage = () => {
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket } = useSocket() || {}; // Provide default empty object

    useEffect(() => {
        // Socket listener for message seen event
        const handleMessagesSeen = ({ conversationId }) => {
            setConversations((prev) => {
                const updatedConversations = prev.map((conversation) => {
                    if (conversation._id === conversationId) {
                        return {
                            ...conversation,
                            lastMessage: {
                                ...conversation.lastMessage,
                                seen: true,
                            },
                        };
                    }
                    return conversation;
                });
                return updatedConversations;
            });
        };

        if (socket) {
            socket.on("messagesSeen", handleMessagesSeen);
            return () => {
                socket.off("messagesSeen", handleMessagesSeen);
            };
        }
    }, [socket, setConversations]);

    useEffect(() => {
        // Fetch conversations on component mount
        const getConversations = async () => {
            try {
                const res = await fetch("/api/messages/conversations");
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };

        getConversations();
    }, [showToast, setConversations]);

    const handleConversationSearch = async (e) => {
        e.preventDefault();
        setSearchingUser(true);
        try {
            const res = await fetch(`/api/users/profile/${searchText}`);
            const searchedUser = await res.json();
            if (searchedUser.error) {
                showToast("Error", searchedUser.error, "error");
                return;
            }

            if (searchedUser._id === currentUser._id) {
                showToast("Error", "You cannot message yourself", "error");
                return;
            }

            const conversationAlreadyExists = conversations.find(
                (conversation) => conversation.participants[0]._id === searchedUser._id
            );

            if (conversationAlreadyExists) {
                setSelectedConversation({
                    _id: conversationAlreadyExists._id,
                    userId: searchedUser._id,
                    username: searchedUser.username,
                    userProfilePic: searchedUser.profilePic,
                });
                return;
            }

            const mockConversation = {
                mock: true,
                lastMessage: {
                    text: "",
                    sender: "",
                },
                _id: Date.now(),
                participants: [
                    {
                        _id: searchedUser._id,
                        username: searchedUser.username,
                        profilePic: searchedUser.profilePic,
                    },
                ],
            };
            setConversations((prevConvs) => [...prevConvs, mockConversation]);
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setSearchingUser(false);
        }
    };

    return (
        <Flex
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            w={{ base: "100%", md: "80%" }}
            h="90vh" // Set height to accommodate the chat layout
            p={5}
            bg={useColorModeValue("gray.50", "gray.800")} // Background color
        >
            {/* User List Section */}
            <Box
                flex="1"
                borderRight="1px"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                pr={4} // Padding on the right
            >
                <Flex mb={5} alignItems="center">
                    <Input
                        placeholder="Search for a user..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        mr={3}
                    />
                    <Button onClick={handleConversationSearch} isLoading={searchingUser}>
                        <SearchIcon />
                    </Button>
                </Flex>
                {loadingConversations ? (
                    <Skeleton>
                        <SkeletonCircle size="10" />
                        <Skeleton height="20px" />
                    </Skeleton>
                ) : (
                    conversations.map((conversation) => (
                        <Conversation key={conversation._id} conversation={conversation} />
                    ))
                )}
            </Box>

            {/* Chat Box Section */}
            <Box flex="2" pl={4}> {/* Adjust padding as needed */}
                <MessageContainer selectedConversation={selectedConversation} socket={socket} />
            </Box>
        </Flex>
    );
};

export default ChatPage;
