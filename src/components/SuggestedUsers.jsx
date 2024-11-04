import { Box, Flex, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SuggestedUser from "./SuggestedUser";
import useShowToast from "../hooks/useShowToast";

const SuggestedUsers = () => {
    const [loading, setLoading] = useState(true);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const showToast = useShowToast();
    const token = localStorage.getItem("token");

    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("https://threadsapp-backend.onrender.com/api/users/suggested", {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    credentials: 'include'
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to fetch suggested users');
                }

                const data = await res.json();
                setSuggestedUsers(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getSuggestedUsers();
    }, [showToast, token]);

    return (
        <>
            <Text mb={4} fontWeight={"bold"}>
                Suggested Users
            </Text>
            <Flex direction={"column"} gap={4}>
                {!loading && suggestedUsers.map((user) => <SuggestedUser key={user._id} user={user} />)}
                {loading &&
                    [0, 1, 2, 3, 4].map((_, idx) => (
                        <Flex key={idx} gap={2} alignItems={"center"} p={"1"} borderRadius={"md"}>
                            <Box>
                                <SkeletonCircle size={"10"} />
                            </Box>
                            <Flex w={"full"} flexDirection={"column"} gap={2}>
                                <Skeleton h={"8px"} w={"80px"} />
                                <Skeleton h={"8px"} w={"90px"} />
                            </Flex>
                            <Flex>
                                <Skeleton h={"20px"} w={"60px"} />
                            </Flex>
                        </Flex>
                    ))}
            </Flex>
        </>
    );
};

export default SuggestedUsers;
