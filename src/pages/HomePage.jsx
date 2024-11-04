import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const HomePage = () => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [loading, setLoading] = useState(true);
    const showToast = useShowToast();
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchFeedPosts = async () => {
            setLoading(true);
            setPosts([]);
            try {
                const res = await fetch("https://threadsapp-backend.onrender.com/api/posts/feed", {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error("Fetch feed posts error:", errorData);
                    if (res.status === 401) {
                        showToast("Error", errorData.message || "Unauthorized access. Please log in.", "error");
                        return;
                    }
                    showToast("Error", errorData.message || "Failed to fetch feed posts", "error");
                    return;
                }

                const data = await res.json();
                setPosts(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        fetchFeedPosts();
    }, [showToast, setPosts, token]);

    return (
        <Flex gap='10' alignItems={"flex-start"}>
            <Box flex={70}>
                {loading && (
                    <Flex justify='center'>
                        <Spinner size='xl' />
                    </Flex>
                )}
                {!loading && posts.length === 0 && <h1>Follow some users to see the feed</h1>}
                {posts.map((post) => (
                    <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
            </Box>
            <Box
                flex={30}
                display={{
                    base: "none",
                    md: "block",
                }}
            >
                <SuggestedUsers />
            </Box>
        </Flex>
    );
};

export default HomePage;
