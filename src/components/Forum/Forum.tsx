import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { useUser } from "../../context/UserContext";
import { isAdminWallet } from "../../config/admin";
import {
  getForumPosts,
  createForumPost,
  togglePostLike,
  getPostComments,
  createForumComment,
  toggleCommentLike,
  deleteForumPost,
  deleteForumComment,
  getProfileByUsername,
  getAvatar,
} from "../../services/firebaseServices";
import type {
  ForumPost,
  ForumComment,
  UserProfile,
} from "../../services/firebaseServices";
import "./Forum.css";

// ── Time ago helper ────────────────────────
const timeAgo = (timestamp: any): string => {
  if (!timestamp) return "";
  const now = Date.now();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

function UserProfileModal({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getProfileByUsername(username);
        setProfile(p);
        if (p?.hasAvatar && p.walletAddress) {
          const av = await getAvatar(p.walletAddress);
          setAvatar(av);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : !profile ? (
          <p
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            Profile not found
          </p>
        ) : (
          <div className="modal-profile">
            {avatar ? (
              <img src={avatar} alt="avatar" className="modal-avatar" />
            ) : (
              <div className="modal-avatar-placeholder">🎛️</div>
            )}
            <h2 className="modal-username">@{profile.username}</h2>
            <p className="modal-wallet">
              {profile.walletAddress?.slice(0, 8)}...
              {profile.walletAddress?.slice(-6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Forum() {
  const { isConnected, address } = useWallet();
  const { profile } = useUser();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, ForumComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  // new post
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postStatus, setPostStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [postMessage, setPostMessage] = useState("");

  // new comment
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<Record<string, string>>({});
  const [viewingUser, setViewingUser] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getForumPosts();
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!isConnected) {
      setPostStatus("error");
      setPostMessage("Connect your wallet to post");
      return;
    }
    if (!profile?.username) {
      setPostStatus("error");
      setPostMessage("You need a username to post — set one in your Profile");
      return;
    }
    if (!postTitle.trim()) {
      setPostStatus("error");
      setPostMessage("Title is required");
      return;
    }
    if (postContent.trim().length < 10) {
      setPostStatus("error");
      setPostMessage("Content must be at least 10 characters");
      return;
    }

    try {
      setPostStatus("loading");
      await createForumPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        author: address.toLowerCase(),
        username: profile.username,
      });
      setPostTitle("");
      setPostContent("");
      setPostStatus("success");
      setPostMessage("✅ Post created!");
      await loadPosts();
      setTimeout(() => setPostStatus("idle"), 2000);
    } catch (error: any) {
      setPostStatus("error");
      setPostMessage(error?.message || "Failed to create post");
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);

    if (!comments[postId]) {
      setLoadingComments(postId);
      try {
        const data = await getPostComments(postId);
        setComments((prev) => ({ ...prev, [postId]: data }));
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoadingComments(null);
      }
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isConnected) return;
    await togglePostLike(postId, address);
    await loadPosts();
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!isConnected) return;
    await toggleCommentLike(commentId, address);
    const data = await getPostComments(postId);
    setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const handleAddComment = async (postId: string) => {
    if (!isConnected) return;
    if (!profile?.username) return;
    const text = commentText[postId]?.trim();
    if (!text || text.length < 2) return;

    setCommentLoading(postId);
    try {
      await createForumComment({
        postId,
        content: text,
        author: address.toLowerCase(),
        username: profile.username,
      });
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      const data = await getPostComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
      await loadPosts();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setCommentLoading(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await deleteForumPost(postId);
    await loadPosts();
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    await deleteForumComment(commentId);
    const data = await getPostComments(postId);
    setComments((prev) => ({ ...prev, [postId]: data }));
    await loadPosts();
  };

  const isAdmin = isConnected && isAdminWallet(address);
  const isMyPost = (post: ForumPost) => post.author === address?.toLowerCase();
  const isMyComment = (comment: ForumComment) =>
    comment.author === address?.toLowerCase();
  const hasLikedPost = (post: ForumPost) =>
    post.likes.includes(address?.toLowerCase());
  const hasLikedComment = (comment: ForumComment) =>
    comment.likes.includes(address?.toLowerCase());

  return (
    <div className="forum-page">
      <h1>Forum</h1>
      <p className="subtitle">
        Discuss music, production tips and everything BeatExchange can offer
      </p>

      {/* ── New Post Form ──────────────────── */}
      {isConnected && profile?.username ? (
        <div className="new-post-form">
          <h2>Create Post</h2>
          <input
            type="text"
            placeholder="Post title..."
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={100}
          />
          <textarea
            placeholder="What's on your mind? Share tips, ask questions..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            maxLength={2000}
          />
          {postStatus !== "idle" && (
            <div
              className={`status ${postStatus === "loading" ? "loading" : postStatus}`}
            >
              {postMessage}
            </div>
          )}
          <button
            className="btn-post-submit"
            onClick={handleCreatePost}
            disabled={postStatus === "loading"}
          >
            {postStatus === "loading" ? "Posting..." : "+ Post"}
          </button>
        </div>
      ) : isConnected && !profile?.username ? (
        <div className="wallet-warning">
          ✍️ Set a username in your Profile to post in the forum
        </div>
      ) : (
        <div className="wallet-warning">
          🔌 Connect your wallet to participate in the forum
        </div>
      )}

      {/* ── Posts List ────────────────────── */}
      {loading ? (
        <p className="loading-text">⏳ Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="empty-text">
          No posts yet — be the first to start a discussion!
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              {/* ── Post Header ─────────────── */}
              <div className="post-card-header">
                <div className="post-meta">
                  <span
                    className="post-author"
                    onClick={() => setViewingUser(post.username)}
                    style={{ cursor: "pointer" }}
                  >
                    @{post.username}
                  </span>
                  <span className="post-time">{timeAgo(post.createdAt)}</span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">{post.content}</p>
              </div>

              {/* ── Post Actions ─────────────── */}
              <div className="post-actions">
                <button
                  className={`btn-like ${hasLikedPost(post) ? "liked" : ""}`}
                  onClick={() => handleLikePost(post.id!)}
                  disabled={!isConnected}
                >
                  ♥ {post.likes.length}
                </button>

                <button
                  className={`btn-comments ${expandedPost === post.id ? "open" : ""}`}
                  onClick={() => handleToggleComments(post.id!)}
                >
                  💬 {post.commentCount}
                </button>

                {(isMyPost(post) || isAdmin) && (
                  <button
                    className="btn-delete-post"
                    onClick={() => handleDeletePost(post.id!)}
                  >
                    🗑 Delete
                  </button>
                )}
              </div>

              {/* ── Comments Section ──────────── */}
              {expandedPost === post.id && (
                <div className="comments-section">
                  {/* Comments list */}
                  {loadingComments === post.id ? (
                    <p className="loading-text" style={{ padding: "1rem 0" }}>
                      Loading comments...
                    </p>
                  ) : (comments[post.id!] || []).length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        letterSpacing: "1px",
                      }}
                    >
                      No comments yet — be the first!
                    </p>
                  ) : (
                    (comments[post.id!] || []).map((comment) => (
                      <div key={comment.id} className="comment">
                        <div className="comment-meta">
                          <span
                            className="comment-author"
                            onClick={() => setViewingUser(comment.username)}
                            style={{ cursor: "pointer" }}
                          >
                            @{comment.username}
                          </span>
                          <span className="comment-time">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="comment-content">{comment.content}</p>
                        <div className="comment-actions">
                          <button
                            className={`btn-comment-like ${hasLikedComment(comment) ? "liked" : ""}`}
                            onClick={() =>
                              handleLikeComment(post.id!, comment.id!)
                            }
                            disabled={!isConnected}
                          >
                            ♥ {comment.likes.length}
                          </button>

                          {/* ✅ new reply button */}
                          <button
                            className="btn-comment-like"
                            style={{
                              color: "var(--text-muted)",
                              marginLeft: "0.5rem",
                            }}
                            onClick={() => {
                              setCommentText((prev) => ({
                                ...prev,
                                [post.id!]: `@${comment.username} `,
                              }));
                              setReplyingTo((prev) => ({
                                ...prev,
                                [post.id!]: comment.username,
                              }));
                              document
                                .getElementById(`comment-input-${post.id}`)
                                ?.focus();
                            }}
                          >
                            ↩ Reply
                          </button>

                          {(isMyComment(comment) || isAdmin) && (
                            <button
                              className="btn-comment-delete"
                              onClick={() =>
                                handleDeleteComment(post.id!, comment.id!)
                              }
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add comment */}
                  <div className="add-comment">
                    {replyingTo[post.id!] && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--accent)",
                          letterSpacing: "1px",
                          marginBottom: "0.4rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        ↩ Replying to @{replyingTo[post.id!]}
                        <button
                          onClick={() => {
                            setReplyingTo((prev) => ({
                              ...prev,
                              [post.id!]: "",
                            }));
                            setCommentText((prev) => ({
                              ...prev,
                              [post.id!]: "",
                            }));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                          }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                    <textarea
                      id={`comment-input-${post.id}`}
                      placeholder="Write a comment..."
                      value={commentText[post.id!] || ""}
                      onChange={(e) =>
                        setCommentText((prev) => ({
                          ...prev,
                          [post.id!]: e.target.value,
                        }))
                      }
                      maxLength={500}
                    />
                    <button
                      className="btn-comment-submit"
                      onClick={() => {
                        handleAddComment(post.id!);
                        setReplyingTo((prev) => ({ ...prev, [post.id!]: "" }));
                      }}
                      disabled={commentLoading === post.id}
                    >
                      {commentLoading === post.id ? "..." : "Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {viewingUser && (
        <UserProfileModal
          username={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  );
}
